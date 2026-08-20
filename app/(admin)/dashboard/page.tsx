import Link from "next/link";
import { buildDashboardMetrics, MeasurementNotes, MetricCard, ThroughputChart } from "@/components/dashboard";
import { requireUser } from "@/lib/supabase/auth";
import { getThroughputMetrics } from "@/lib/queries/dashboard";

export const metadata = { title: "Dashboard | ClearPath" };

export default async function DashboardShellPage() {
  const user = await requireUser(["admin"]);
  const metrics = buildDashboardMetrics(await getThroughputMetrics());
  const hasActivity = metrics.some((metric) => metric.value > 0);

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-slate-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Administrative overview
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Operations dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">
              Welcome, {user.profile.full_name || user.email || "administrator"}. A live operating
              snapshot of the compliance review pipeline.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <span className="inline-flex items-center gap-2 self-start text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:self-auto"><span aria-hidden className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]" />Live audit data</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/rules"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Manage rules
              </Link>
              <Link
                href="/queue"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Open review queue
              </Link>
            </div>
          </div>
        </header>

        {!hasActivity ? <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="status">Metrics are connected, but no completed screening or review activity is available yet. Values will populate as the workflow runs.</div> : null}

        <section aria-label="Throughput metrics" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => <MetricCard featured={index === 0} index={index + 1} key={metric.key} metric={metric} />)}
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.75fr)]">
          <ThroughputChart metrics={metrics} />
          <MeasurementNotes metrics={metrics} />
        </div>
      </div>
    </main>
  );
}
