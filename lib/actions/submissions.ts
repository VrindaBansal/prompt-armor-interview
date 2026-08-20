'use server';

// Server actions implementing the review state machine. Every mutating
// transition writes an audit_log row via writeAudit, so
// no path bypasses the audit trail (C1).
//
// State machine:
//   draft ──submitForReview──▶ pending_ai ──(AI check)──▶ ai_screened
//   changes_requested ──submitForReview──▶ pending_ai ──▶ ai_screened
//   ai_screened ──startReview──▶ in_review
//   in_review | ai_screened ──decideReview──▶ approved | changes_requested | rejected
//
// Authorization reads go through the RLS-scoped request client. Mutations use
// the server-only service client only after explicit role, ownership, and state
// checks, preventing direct browser database calls from bypassing the audit
// trail or state machine.

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

const CHANNELS = new Set(['ad', 'email', 'affiliate_landing', 'social']);
const PRODUCTS = new Set(['personal_loan', 'credit_card', 'mortgage_prequal']);
const DECISIONS = new Set<Decision>([
  'approved',
  'changes_requested',
  'rejected',
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireId(value: unknown) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error('Invalid identifier');
  }
}

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
  if (user.profile.role !== 'submitter') throw new Error('Forbidden');
  if (
    !input ||
    typeof input.title !== 'string' ||
    input.title.trim().length === 0 ||
    input.title.trim().length > 120 ||
    typeof input.content !== 'string' ||
    input.content.trim().length < 20 ||
    input.content.trim().length > 12_000 ||
    !CHANNELS.has(input.channel) ||
    !PRODUCTS.has(input.product_type) ||
    typeof input.is_affiliate !== 'boolean'
  ) {
    throw new Error('Invalid submission');
  }

  const service = createServiceClient();

  const { data, error } = await service
    .from('submissions')
    .insert({
      submitter_id: user.id,
      title: input.title.trim(),
      channel: input.channel,
      product_type: input.product_type,
      content: input.content.trim(),
      is_affiliate: input.is_affiliate,
      status: 'draft',
    })
    .select('*')
    .single<Submission>();
  if (error || !data) throw new Error(error?.message ?? 'createSubmission failed');

  try {
    await writeAudit({
      submission_id: data.id,
      actor_id: user.id,
      action: 'create',
      to_status: 'draft',
    });
  } catch (error) {
    await service.from('submissions').delete().eq('id', data.id);
    throw error;
  }

  revalidatePath('/submissions');
  return data;
}

// ── submitForReview ─────────────────────────────────────────────────────────
// draft | changes_requested → pending_ai, run the AI check, → ai_screened.
export async function submitForReview(submissionId: string): Promise<void> {
  requireId(submissionId);
  const user = await requireSession();
  if (user.profile.role !== 'submitter') throw new Error('Forbidden');
  const supabase = await createClient();

  const { data: current, error: readErr } = await supabase
    .from('submissions')
    .select('id, status, submitter_id')
    .eq('id', submissionId)
    .single<Pick<Submission, 'id' | 'status' | 'submitter_id'>>();
  if (readErr || !current) throw new Error('Submission not found');
  if (current.submitter_id !== user.id) throw new Error('Forbidden');
  if (current.status !== 'draft' && current.status !== 'changes_requested') {
    throw new Error(`Cannot submit from status ${current.status}`);
  }

  const service = createServiceClient();
  const { data: transitioned, error: pendErr } = await service
    .from('submissions')
    .update({ status: 'pending_ai' })
    .eq('id', submissionId)
    .eq('submitter_id', user.id)
    .eq('status', current.status)
    .select('id')
    .maybeSingle();
  if (pendErr || !transitioned) {
    throw new Error(pendErr?.message ?? 'Submission state changed; refresh and try again');
  }

  try {
    await writeAudit({
      submission_id: submissionId,
      actor_id: user.id,
      action: 'submit_for_review',
      from_status: current.status,
      to_status: 'pending_ai',
    });
  } catch (error) {
    await service
      .from('submissions')
      .update({ status: current.status })
      .eq('id', submissionId)
      .eq('status', 'pending_ai');
    throw error;
  }

  let summary: Awaited<ReturnType<typeof runComplianceCheck>>;
  try {
    summary = await runComplianceCheck(submissionId);
  } catch (error) {
    const { data: reverted } = await service
      .from('submissions')
      .update({ status: current.status })
      .eq('id', submissionId)
      .eq('status', 'pending_ai')
      .select('id')
      .maybeSingle();
    if (reverted) {
      await writeAudit({
        submission_id: submissionId,
        actor_id: user.id,
        action: 'ai_screening_failed',
        from_status: 'pending_ai',
        to_status: current.status,
      });
    }
    throw error;
  }

  const { data: screened, error: screenErr } = await service
    .from('submissions')
    .update({ status: 'ai_screened' })
    .eq('id', submissionId)
    .eq('status', 'pending_ai')
    .select('id')
    .maybeSingle();
  if (screenErr || !screened) {
    throw new Error(screenErr?.message ?? 'Submission state changed during screening');
  }

  try {
    await writeAudit({
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
  } catch (error) {
    await service
      .from('submissions')
      .update({ status: 'pending_ai' })
      .eq('id', submissionId)
      .eq('status', 'ai_screened');
    throw error;
  }

  revalidatePath('/submissions');
  revalidatePath('/queue');
}

// ── startReview ─────────────────────────────────────────────────────────────
// Reviewer opens an item: ai_screened → in_review. Reviewer-only surface, not
// part of the B-facing contract. No-op if already in_review.
export async function startReview(submissionId: string): Promise<void> {
  requireId(submissionId);
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

  const service = createServiceClient();
  const { data: transitioned, error } = await service
    .from('submissions')
    .update({ status: 'in_review' })
    .eq('id', submissionId)
    .eq('status', 'ai_screened')
    .select('id')
    .maybeSingle();
  if (error || !transitioned) {
    throw new Error(error?.message ?? 'Submission state changed; refresh and try again');
  }

  try {
    await writeAudit({
      submission_id: submissionId,
      actor_id: user.id,
      action: 'start_review',
      from_status: 'ai_screened',
      to_status: 'in_review',
    });
  } catch (error) {
    await service
      .from('submissions')
      .update({ status: 'ai_screened' })
      .eq('id', submissionId)
      .eq('status', 'in_review');
    throw error;
  }

  revalidatePath('/queue');
}

// ── decideReview ────────────────────────────────────────────────────────────
export async function decideReview(
  submissionId: string,
  decision: Decision,
  notes?: string,
): Promise<void> {
  requireId(submissionId);
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  if (!DECISIONS.has(decision)) throw new Error('Invalid decision');
  if (notes !== undefined && typeof notes !== 'string') {
    throw new Error('Invalid reviewer notes');
  }
  const trimmedNotes = notes?.trim() || null;
  if (trimmedNotes && trimmedNotes.length > 4_000) {
    throw new Error('Reviewer notes must be 4,000 characters or fewer');
  }
  if (decision === 'changes_requested' && !trimmedNotes) {
    throw new Error('Reviewer notes are required when requesting changes');
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

  const service = createServiceClient();
  const { data: transitioned, error: updErr } = await service
    .from('submissions')
    .update({ status: decision })
    .eq('id', submissionId)
    .eq('status', current.status)
    .select('id')
    .maybeSingle();
  if (updErr || !transitioned) {
    throw new Error(updErr?.message ?? 'Submission state changed; refresh and try again');
  }

  const { data: review, error: revErr } = await service
    .from('reviews')
    .insert({
      submission_id: submissionId,
      reviewer_id: user.id,
      decision,
      notes: trimmedNotes,
    })
    .select('id')
    .single<{ id: string }>();
  if (revErr || !review) {
    await service
      .from('submissions')
      .update({ status: current.status })
      .eq('id', submissionId)
      .eq('status', decision);
    throw new Error(revErr?.message ?? 'Failed to record review');
  }

  try {
    await writeAudit({
      submission_id: submissionId,
      actor_id: user.id,
      action: 'decide',
      from_status: current.status,
      to_status: decision,
      metadata: trimmedNotes ? { notes: trimmedNotes } : {},
    });
  } catch (error) {
    await service.from('reviews').delete().eq('id', review.id);
    await service
      .from('submissions')
      .update({ status: current.status })
      .eq('id', submissionId)
      .eq('status', decision);
    throw error;
  }

  revalidatePath('/queue');
  revalidatePath('/submissions');
}

// ── setFlagAgreement ────────────────────────────────────────────────────────
export async function setFlagAgreement(
  aiCheckId: string,
  agreed: boolean,
): Promise<void> {
  requireId(aiCheckId);
  const user = await requireSession();
  if (user.profile.role !== 'reviewer' && user.profile.role !== 'admin') {
    throw new Error('Forbidden');
  }
  if (typeof agreed !== 'boolean') throw new Error('Invalid agreement value');
  const supabase = await createClient();

  const { data: check, error: readErr } = await supabase
    .from('ai_checks')
    .select('id, submission_id, agreed')
    .eq('id', aiCheckId)
    .single<{ id: string; submission_id: string; agreed: boolean | null }>();
  if (readErr || !check) throw new Error('Flag not found');

  const service = createServiceClient();
  const { data: updated, error } = await service
    .from('ai_checks')
    .update({ agreed })
    .eq('id', aiCheckId)
    .select('id')
    .maybeSingle();
  if (error || !updated) throw new Error(error?.message ?? 'Flag not found');

  try {
    await writeAudit({
      submission_id: check.submission_id,
      actor_id: user.id,
      action: 'flag_agreement',
      metadata: { ai_check_id: aiCheckId, agreed },
    });
  } catch (error) {
    await service.from('ai_checks').update({ agreed: check.agreed }).eq('id', aiCheckId);
    throw error;
  }

  revalidatePath('/queue');
}

// ── addComment ──────────────────────────────────────────────────────────────
export async function addComment(
  submissionId: string,
  body: string,
): Promise<Comment> {
  requireId(submissionId);
  if (typeof body !== 'string') throw new Error('Invalid comment');
  const user = await requireSession();
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Comment cannot be empty');
  if (trimmed.length > 2_000) {
    throw new Error('Comments must be 2,000 characters or fewer');
  }

  const supabase = await createClient();
  const { data: visible } = await supabase
    .from('submissions')
    .select('id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!visible) throw new Error('Submission not found');

  const service = createServiceClient();
  const { data, error } = await service
    .from('comments')
    .insert({ submission_id: submissionId, author_id: user.id, body: trimmed })
    .select('*')
    .single<Comment>();
  if (error || !data) throw new Error(error?.message ?? 'addComment failed');

  try {
    await writeAudit({
      submission_id: submissionId,
      actor_id: user.id,
      action: 'comment',
      metadata: { comment_id: data.id },
    });
  } catch (error) {
    await service.from('comments').delete().eq('id', data.id);
    throw error;
  }

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
  requireId(id);
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
