import type { DashboardMetric } from "./dashboard-metrics";

export function ThroughputChart({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <figure className="relative overflow-hidden rounded-lg border border-slate-950 bg-slate-950 px-5 py-6 text-white shadow-sm sm:px-7 sm:py-7">
      <div aria-hidden className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:100%_32px]" />
      <div className="relative">
        <figcaption className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-400">Live throughput profile</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Five signals, one operating view</h2>
          </div>
          <p className="max-w-xs text-xs leading-5 text-slate-400">Each row uses its own labeled unit scale. Scale caps are display bounds, not performance targets.</p>
        </figcaption>

        <div className="mt-6 grid gap-6">
          {metrics.map((metric) => (
            <div key={metric.key}>
              <div className="flex items-end justify-between gap-4 text-xs">
                <span className="font-semibold text-slate-200">{metric.shortLabel}</span>
                <span className="font-mono text-slate-400"><strong className="font-semibold text-white">{metric.displayValue}</strong> {metric.unit}</span>
              </div>
              <div aria-label={`${metric.label}: ${metric.displayValue} ${metric.unit}, shown on a scale from zero to ${metric.scaleEnd}`} className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10" role="img">
                <div className={`h-full rounded-full ${metric.barClass}`} style={{ width: `${metric.scalePercent}%` }} />
              </div>
              <div aria-hidden className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-500"><span>0</span><span>{metric.scaleEnd}</span></div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
