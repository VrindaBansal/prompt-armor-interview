'use server';

// Server actions implementing the review state machine (execution-plan.md §4.2,
// §7 A2). Every mutating transition writes an audit_log row via writeAudit, so
// no path bypasses the audit trail (C1).
//
// State machine:
//   draft ──submitForReview──▶ pending_ai ──(AI check)──▶ ai_screened
//   changes_requested ──submitForReview──▶ pending_ai ──▶ ai_screened
//   ai_screened ──startReview──▶ in_review
//   in_review | ai_screened ──decideReview──▶ approved | changes_requested | rejected
//
// Reads/writes go through the RLS-scoped server client so a user can only touch
// what their role permits. The one exception is the ai_screened transition and
// the ai_checks write, which are system actions done with the service client
// (a submitter's RLS grant does not cover a pending_ai → ai_screened update).

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getSessionUser } from '@/lib/supabase/auth';
import { runComplianceCheck } from '@/lib/ai/check';
import { writeAudit } from './audit';
import type {
  AiCheckWithRule,
  Comment,
  Decision,
  NewSubmission,
  Review,
  Severity,
  Submission,
  SubmissionDetail,
  SubmissionWithFlags,
} from '@/lib/types';

const SEVERITY_RANK: Record<Severity, number> = {
  blocker: 3,
  warning: 2,
  advisory: 1,
};

async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}

// ── createSubmission ────────────────────────────────────────────────────────
export async function createSubmission(
  input: NewSubmission,
): Promise<Submission> {
  const user = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      submitter_id: user.id,
      title: input.title,
      channel: input.channel,
      product_type: input.product_type,
      content: input.content,
      is_affiliate: input.is_affiliate,
      status: 'draft',
    })
    .select('*')
    .single<Submission>();
  if (error || !data) throw new Error(error?.message ?? 'createSubmission failed');

  await writeAudit(supabase, {
    submission_id: data.id,
    actor_id: user.id,
    action: 'create',
    to_status: 'draft',
  });

  revalidatePath('/submissions');
  return data;
}

// ── submitForReview ─────────────────────────────────────────────────────────
// draft | changes_requested → pending_ai, run the AI check, → ai_screened.
export async function submitForReview(submissionId: string): Promise<void> {
  const user = await requireSession();
  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from('submissions')
    .select('id, status, submitter_id')
    .eq('id', submissionId)
    .single<Pick<Submission, 'id' | 'status' | 'submitter_id'>>();
  if (readErr || !current) throw new Error('Submission not found');
  if (current.status !== 'draft' && current.status !== 'changes_requested') {
    throw new Error(`Cannot submit from status ${current.status}`);
  }

  // Move to pending_ai as the user (RLS allows this from draft/changes_requested).
  const { error: pendErr } = await supabase
    .from('submissions')
    .update({ status: 'pending_ai' })
    .eq('id', submissionId);
  if (pendErr) throw new Error(pendErr.message);

  await writeAudit(supabase, {
    submission_id: submissionId,
    actor_id: user.id,
    action: 'submit_for_review',
    from_status: current.status,
    to_status: 'pending_ai',
  });

  // Run the compliance check and flip to ai_screened as the system (service
  // client): a submitter's RLS grant does not cover pending_ai → ai_screened.
  const service = createServiceClient();
  const summary = await runComplianceCheck(submissionId);

  const { error: screenErr } = await service
    .from('submissions')
    .update({ status: 'ai_screened' })
    .eq('id', submissionId);
  if (screenErr) throw new Error(screenErr.message);

  await writeAudit(service, {
    submission_id: submissionId,
    actor_id: user.id,
    action: 'ai_screened',
    from_status: 'pending_ai',
    to_status: 'ai_screened',
    metadata: {
      applicable_rules: summary.applicableRuleCount,
      failures: summary.failures,
      needs_human: summary.needsHuman,
    },
  });

  revalidatePath('/submissions');
  revalidatePath('/queue');
}

// ── startReview ─────────────────────────────────────────────────────────────
// Reviewer opens an item: ai_screened → in_review. Reviewer-only surface, not
// part of the B-facing contract. No-op if already in_review.
export async function startReview(submissionId: string): Promise<void> {
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  const supabase = await createClient();

  const { data: current } = await supabase
    .from('submissions')
    .select('status')
    .eq('id', submissionId)
    .single<Pick<Submission, 'status'>>();
  if (!current || current.status !== 'ai_screened') return;

  const { error } = await supabase
    .from('submissions')
    .update({ status: 'in_review' })
    .eq('id', submissionId);
  if (error) throw new Error(error.message);

  await writeAudit(supabase, {
    submission_id: submissionId,
    actor_id: user.id,
    action: 'start_review',
    from_status: 'ai_screened',
    to_status: 'in_review',
  });

  revalidatePath('/queue');
}

// ── decideReview ────────────────────────────────────────────────────────────
export async function decideReview(
  submissionId: string,
  decision: Decision,
  notes?: string,
): Promise<void> {
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from('submissions')
    .select('status')
    .eq('id', submissionId)
    .single<Pick<Submission, 'status'>>();
  if (readErr || !current) throw new Error('Submission not found');
  if (current.status !== 'in_review' && current.status !== 'ai_screened') {
    throw new Error(`Cannot decide from status ${current.status}`);
  }

  // Record the review, then apply the decision as the new status.
  const { error: revErr } = await supabase.from('reviews').insert({
    submission_id: submissionId,
    reviewer_id: user.id,
    decision,
    notes: notes ?? null,
  });
  if (revErr) throw new Error(revErr.message);

  const { error: updErr } = await supabase
    .from('submissions')
    .update({ status: decision })
    .eq('id', submissionId);
  if (updErr) throw new Error(updErr.message);

  await writeAudit(supabase, {
    submission_id: submissionId,
    actor_id: user.id,
    action: 'decide',
    from_status: current.status,
    to_status: decision,
    metadata: notes ? { notes } : {},
  });

  revalidatePath('/queue');
  revalidatePath('/submissions');
}

// ── setFlagAgreement ────────────────────────────────────────────────────────
export async function setFlagAgreement(
  aiCheckId: string,
  agreed: boolean,
): Promise<void> {
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  const supabase = await createClient();

  const { data: check, error: readErr } = await supabase
    .from('ai_checks')
    .select('id, submission_id')
    .eq('id', aiCheckId)
    .single<{ id: string; submission_id: string }>();
  if (readErr || !check) throw new Error('Flag not found');

  const { error } = await supabase
    .from('ai_checks')
    .update({ agreed })
    .eq('id', aiCheckId);
  if (error) throw new Error(error.message);

  await writeAudit(supabase, {
    submission_id: check.submission_id,
    actor_id: user.id,
    action: 'flag_agreement',
    metadata: { ai_check_id: aiCheckId, agreed },
  });

  revalidatePath('/queue');
}

// ── addComment ──────────────────────────────────────────────────────────────
export async function addComment(
  submissionId: string,
  body: string,
): Promise<Comment> {
  const user = await requireSession();
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Comment cannot be empty');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('comments')
    .insert({ submission_id: submissionId, author_id: user.id, body: trimmed })
    .select('*')
    .single<Comment>();
  if (error || !data) throw new Error(error?.message ?? 'addComment failed');

  await writeAudit(supabase, {
    submission_id: submissionId,
    actor_id: user.id,
    action: 'comment',
    metadata: { comment_id: data.id },
  });

  revalidatePath('/submissions');
  revalidatePath('/queue');
  return data;
}

// ── listQueue ───────────────────────────────────────────────────────────────
// Reviewer queue: items awaiting reviewer action, sorted by max failing
// severity then age (oldest first). RLS-scoped (reviewer/admin see all).
export async function listQueue(): Promise<SubmissionWithFlags[]> {
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from('submissions')
    .select(
      'id, submitter_id, title, channel, product_type, content, is_affiliate, status, created_at, updated_at, ' +
        'profiles!submissions_submitter_id_fkey(full_name), ' +
        'ai_checks(verdict, rules(severity))',
    )
    .in('status', ['ai_screened', 'in_review']);
  if (error) throw new Error(error.message);

  type Row = Submission & {
    profiles: { full_name: string | null } | null;
    ai_checks: { verdict: string; rules: { severity: Severity } | null }[];
  };

  const queue: SubmissionWithFlags[] = (rows as unknown as Row[]).map((r) => {
    const fails = r.ai_checks.filter((c) => c.verdict === 'fail');
    let maxSeverity: Severity | null = null;
    for (const f of fails) {
      const sev = f.rules?.severity;
      if (sev && (!maxSeverity || SEVERITY_RANK[sev] > SEVERITY_RANK[maxSeverity])) {
        maxSeverity = sev;
      }
    }
    return {
      id: r.id,
      submitter_id: r.submitter_id,
      title: r.title,
      channel: r.channel,
      product_type: r.product_type,
      content: r.content,
      is_affiliate: r.is_affiliate,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      submitter_name: r.profiles?.full_name ?? null,
      flag_count: fails.length,
      max_severity: maxSeverity,
    };
  });

  queue.sort((a, b) => {
    const sa = a.max_severity ? SEVERITY_RANK[a.max_severity] : 0;
    const sb = b.max_severity ? SEVERITY_RANK[b.max_severity] : 0;
    if (sb !== sa) return sb - sa; // higher severity first
    return a.created_at.localeCompare(b.created_at); // then oldest first
  });

  return queue;
}

// ── getSubmissionDetail ─────────────────────────────────────────────────────
export async function getSubmissionDetail(id: string): Promise<SubmissionDetail> {
  await requireSession();
  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from('submissions')
    .select(
      '*, profiles!submissions_submitter_id_fkey(full_name)',
    )
    .eq('id', id)
    .single<Submission & { profiles: { full_name: string | null } | null }>();
  if (error || !submission) throw new Error('Submission not found');

  const { data: aiChecks } = await supabase
    .from('ai_checks')
    .select('*, rule:rules(*)')
    .eq('submission_id', id);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('submission_id', id)
    .order('created_at', { ascending: true });

  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('submission_id', id)
    .order('created_at', { ascending: true });

  const { profiles, ...rest } = submission;
  return {
    ...(rest as Submission),
    submitter_name: profiles?.full_name ?? null,
    ai_checks: (aiChecks ?? []) as AiCheckWithRule[],
    reviews: (reviews ?? []) as Review[],
    comments: (comments ?? []) as Comment[],
  };
}
