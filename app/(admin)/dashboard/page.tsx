import Link from "next/link";
import { Card, CardContent } from "@/components/ui";
import { requireUser } from "@/lib/supabase/auth";
import { getThroughputMetrics } from "@/lib/queries/dashboard";

export const metadata = { title: "Dashboard | ClearPath" };

// Feature 12: throughput dashboard. Renders the five A5 metrics live. B6 may
// later layer richer charts on top via components/dashboard.
export default async function DashboardShellPage() {
  const user = await requireUser(["admin"]);
  const m = await getThroughputMetrics();

  const metrics: { label: string; value: string; hint: string }[] = [
    {
      label: "Median time in queue",
      value: `${m.medianTimeInQueueHrs}h`,
      hint: "From AI screening to a reviewer decision.",
    },
    {
      label: "Reviews / reviewer / day",
      value: `${m.reviewsPerReviewerPerDay}`,
      hint: "Reviewer throughput across active days.",
    },
    {
      label: "AI auto-cleared",
      value: `${m.pctAutoCleared}%`,
      hint: "Screened submissions with zero failing flags.",
    },
    {
      label: "Avg revision loops",
      value: `${m.avgRevisionLoops}`,
      hint: "Changes-requested cycles per reviewed item.",
    },
    {
      label: "AI agreement rate",
      value: `${m.aiAgreementRate}%`,
      hint: "Flags reviewers confirmed vs. overrode.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-slate-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Administrative overview
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Operations dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Welcome, {user.profile.full_name || user.email || "administrator"}. Throughput across
              the compliance review pipeline.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/rules"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Manage rules
            </Link>
            <Link
              href="/queue"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Open review queue
            </Link>
          </div>
        </header>

        <section aria-label="Throughput metrics" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{metric.hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
