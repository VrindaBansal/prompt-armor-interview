import { Badge } from "./badge";
import type { Status } from "@/lib/types";

const statusMeta: Record<Status, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", tone: "neutral" },
  pending_ai: { label: "AI pending", tone: "warning" },
  ai_screened: { label: "AI screened", tone: "info" },
  in_review: { label: "In review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  changes_requested: { label: "Changes requested", tone: "warning" },
  rejected: { label: "Rejected", tone: "danger" },
};

export function StatusPill({ status }: { status: Status }) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
