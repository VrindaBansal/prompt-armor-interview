import { Badge } from "./badge";
import type { Severity } from "@/lib/types";

const tone = { blocker: "danger", warning: "warning", advisory: "info" } as const;

export function SeverityTag({ severity }: { severity: Severity }) {
  return <Badge tone={tone[severity]}>{severity}</Badge>;
}
