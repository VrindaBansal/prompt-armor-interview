// Dashboard query layer (execution-plan.md §4.3, §9 A5). Implements the frozen
// getThroughputMetrics contract Agent B's dashboard (B6) consumes.
//
// Runs under the caller's RLS-scoped server client. The dashboard page guards
// to admin (requireUser(['admin'])), and admin RLS sees all rows, so every
// metric is computed over the full dataset.
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { ThroughputMetrics } from '@/lib/types';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

const round = (n: number, dp = 1) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

// Raw rows the metrics are computed from. Kept minimal and serializable so the
// aggregation is a pure function (computeMetrics), independently testable.
export interface MetricInputs {
  checks: { submission_id: string; verdict: string; agreed: boolean | null }[];
  reviews: { submission_id: string; reviewer_id: string; decision: string; created_at: string }[];
  screenEvents: { submission_id: string; created_at: string }[];
}

// The no-arg form (the frozen contract) runs under the caller's RLS server
// client. An explicit client may be injected for testing.
export async function getThroughputMetrics(
  client?: SupabaseClient,
): Promise<ThroughputMetrics> {
  const supabase = client ?? (await createClient());

  const [checksRes, reviewsRes, auditRes] = await Promise.all([
    supabase.from('ai_checks').select('submission_id, verdict, agreed'),
    supabase.from('reviews').select('submission_id, reviewer_id, decision, created_at'),
    supabase
      .from('audit_log')
      .select('submission_id, to_status, created_at')
      .eq('to_status', 'ai_screened'),
  ]);

  return computeMetrics({
    checks: (checksRes.data ?? []) as MetricInputs['checks'],
    reviews: (reviewsRes.data ?? []) as MetricInputs['reviews'],
    screenEvents: (auditRes.data ?? []) as MetricInputs['screenEvents'],
  });
}

// Pure aggregation over already-fetched rows.
export function computeMetrics({ checks, reviews, screenEvents }: MetricInputs): ThroughputMetrics {
  // ── medianTimeInQueueHrs ────────────────────────────────────────────────
  // For each time a submission entered the queue (to_status=ai_screened), pair
  // it with the first review that came after it; the gap is one queue wait.
  // This handles resubmission loops (multiple screen→decide cycles).
  const pushTo = (m: Map<string, number[]>, key: string, val: number) => {
    const arr = m.get(key);
    if (arr) arr.push(val);
    else m.set(key, [val]);
  };
  const screensBySub = new Map<string, number[]>();
  for (const e of screenEvents) {
    pushTo(screensBySub, e.submission_id, new Date(e.created_at).getTime());
  }
  const reviewsBySub = new Map<string, number[]>();
  for (const r of reviews) {
    pushTo(reviewsBySub, r.submission_id, new Date(r.created_at).getTime());
  }
  const waits: number[] = [];
  for (const [sid, screens] of screensBySub) {
    const decisions = (reviewsBySub.get(sid) ?? []).sort((a, b) => a - b);
    for (const s of screens.sort((a, b) => a - b)) {
      const next = decisions.find((d) => d >= s);
      if (next != null) waits.push((next - s) / 3_600_000);
    }
  }
  const medianTimeInQueueHrs = round(median(waits), 1);

  // ── reviewsPerReviewerPerDay ────────────────────────────────────────────
  const reviewerIds = new Set(reviews.map((r) => r.reviewer_id));
  const reviewDays = new Set(reviews.map((r) => r.created_at.slice(0, 10)));
  const reviewsPerReviewerPerDay =
    reviews.length === 0
      ? 0
      : round(reviews.length / (reviewerIds.size * Math.max(1, reviewDays.size)), 2);

  // ── pctAutoCleared ──────────────────────────────────────────────────────
  // Of submissions the AI screened, the share with zero failing flags (i.e.
  // the AI cleared them, no human-blocking violation found).
  const failsBySub = new Map<string, number>();
  const screenedSubs = new Set<string>();
  for (const c of checks) {
    screenedSubs.add(c.submission_id);
    if (c.verdict === 'fail') {
      failsBySub.set(c.submission_id, (failsBySub.get(c.submission_id) ?? 0) + 1);
    }
  }
  const autoCleared = [...screenedSubs].filter((s) => (failsBySub.get(s) ?? 0) === 0).length;
  const pctAutoCleared =
    screenedSubs.size === 0 ? 0 : round((autoCleared / screenedSubs.size) * 100, 1);

  // ── avgRevisionLoops ────────────────────────────────────────────────────
  // Average number of changes-requested decisions per reviewed submission.
  const reviewedSubs = new Set(reviews.map((r) => r.submission_id));
  const changesCount = reviews.filter((r) => r.decision === 'changes_requested').length;
  const avgRevisionLoops =
    reviewedSubs.size === 0 ? 0 : round(changesCount / reviewedSubs.size, 2);

  // ── aiAgreementRate ─────────────────────────────────────────────────────
  // Of flags a reviewer acted on, the share they confirmed (agreed=true).
  const acted = checks.filter((c) => c.agreed !== null);
  const confirmed = acted.filter((c) => c.agreed === true).length;
  const aiAgreementRate = acted.length === 0 ? 0 : round((confirmed / acted.length) * 100, 1);

  return {
    medianTimeInQueueHrs,
    reviewsPerReviewerPerDay,
    pctAutoCleared,
    avgRevisionLoops,
    aiAgreementRate,
  };
}
