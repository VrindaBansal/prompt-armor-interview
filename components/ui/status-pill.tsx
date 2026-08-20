import { Badge } from "./badge";

export type SubmissionStatus = "draft" | "pending_ai" | "ai_screened" | "in_review" | "approved" | "changes_requested" | "rejected";

const statusMeta: Record<SubmissionStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_ai: { label: "AI pending", tone: "warning" },
  ai_screened: { label: "AI screened", tone: "info" },
  in_review: { label: "In review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function StatusPill({ status }: { status: SubmissionStatus }) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
