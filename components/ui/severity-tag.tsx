import { Badge } from "./badge";

export type FlagSeverity = "blocker" | "warning" | "advisory";

const tone = { blocker: "danger", warning: "warning", advisory: "info" } as const;

export function SeverityTag({ severity }: { severity: FlagSeverity }) {
  return <Badge tone={tone[severity]}>{severity}</Badge>;
}
