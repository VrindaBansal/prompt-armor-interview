// Reviewer queue list (A3). Rows are pre-sorted by listQueue (severity, then
// age). Each row links to the detail view.
import Link from "next/link";
import { Badge, Card, CardContent, SeverityTag, StatusPill } from "@/components/ui";
import type { SubmissionWithFlags } from "@/lib/types";

function ageLabel(iso: string): string {
  const hrs = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${Math.floor(hrs)}h in queue`;
  return `${Math.floor(hrs / 24)}d in queue`;
}

export function QueueList({ items }: { items: SubmissionWithFlags[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link href={`/queue/${item.id}`} className="block focus-visible:outline-none">
            <Card className="transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-500">
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold tracking-tight text-slate-950">
                      {item.title}
                    </h3>
                    {item.is_affiliate ? <Badge tone="info">Affiliate</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.submitter_name ?? "Unknown submitter"} · {item.channel} ·{" "}
                    {item.product_type} · {ageLabel(item.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.max_severity ? <SeverityTag severity={item.max_severity} /> : null}
                  <Badge tone={item.flag_count > 0 ? "danger" : "success"}>
                    {item.flag_count} {item.flag_count === 1 ? "flag" : "flags"}
                  </Badge>
                  <StatusPill status={item.status} />
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
