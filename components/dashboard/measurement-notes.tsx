import type { DashboardMetric } from "./dashboard-metrics";

export function MeasurementNotes({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section aria-labelledby="measurement-notes-title" className="rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-7 sm:py-7">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Measurement notes</p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950" id="measurement-notes-title">What the snapshot measures</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Values recalculate from the audit trail, review decisions, and AI checks each time this page loads.</p>

      <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-100">
        {metrics.map((metric) => (
          <div className="grid gap-1 py-4" key={metric.key}>
            <dt className="text-sm font-semibold text-slate-900">{metric.shortLabel}</dt>
            <dd className="text-xs leading-5 text-slate-500">{metric.source}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
