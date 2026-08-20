// SHARED CONTRACT — Agent A owns this file. Agent B imports only.
// Mirrors supabase/migrations/20260820075254_schema_and_rls.sql.
// Changelog:
//   2026-08-20  Initial contract published (enums, row types, action I/O).

export type Role = 'submitter' | 'reviewer' | 'admin';
export type Channel = 'ad' | 'email' | 'affiliate_landing' | 'social';
export type ProductType = 'personal_loan' | 'credit_card' | 'mortgage_prequal';
export type Status =
  | 'draft'
  | 'pending_ai'
  | 'ai_screened'
  | 'in_review'
  | 'approved'
  | 'changes_requested'
  | 'rejected';
export type Severity = 'blocker' | 'warning' | 'advisory';
export type Regulation = 'TILA' | 'UDAAP' | 'FTC_endorsement';
export type Verdict = 'pass' | 'fail' | 'needs_human';
export type Decision = 'approved' | 'changes_requested' | 'rejected';

// ── Row types (mirror the tables 1:1) ──────────────────────────────────────

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  submitter_id: string;
  title: string;
  channel: Channel;
  product_type: ProductType;
  content: string;
  is_affiliate: boolean;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  code: string;
  regulation: Regulation;
  severity: Severity;
  description: string;
  applies_to_channels: Channel[];
  applies_to_product_types: ProductType[];
  created_at: string;
}

export interface AiCheck {
  id: string;
  submission_id: string;
  rule_id: string;
  verdict: Verdict;
  excerpt: string | null;
  explanation: string;
  suggested_fix: string | null;
  confidence: number | null;
  agreed: boolean | null;
  created_at: string;
}

export interface Review {
  id: string;
  submission_id: string;
  reviewer_id: string;
  decision: Decision;
  notes: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  submission_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  submission_id: string;
  actor_id: string | null;
  action: string;
  from_status: Status | null;
  to_status: Status | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Composite / action I/O types ───────────────────────────────────────────

export interface NewSubmission {
  title: string;
  channel: Channel;
  product_type: ProductType;
  content: string;
  is_affiliate: boolean;
}

// An AiCheck joined to the rule it evaluated (for inline flag display).
export interface AiCheckWithRule extends AiCheck {
  rule: Rule;
}

// A queue row: the submission plus enough flag context to sort and triage.
export interface SubmissionWithFlags extends Submission {
  submitter_name: string | null;
  flag_count: number;
  max_severity: Severity | null;
}

// The full review-detail payload for one submission.
export interface SubmissionDetail extends Submission {
  submitter_name: string | null;
  ai_checks: AiCheckWithRule[];
  reviews: Review[];
  comments: Comment[];
}

export interface ThroughputMetrics {
  medianTimeInQueueHrs: number;
  reviewsPerReviewerPerDay: number;
  pctAutoCleared: number;
  avgRevisionLoops: number;
  aiAgreementRate: number;
}
