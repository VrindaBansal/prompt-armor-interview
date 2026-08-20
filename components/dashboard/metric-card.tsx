import { Card, CardContent } from "@/components/ui";
import { cn } from "@/components/ui/utils";

import type { DashboardMetric } from "./dashboard-metrics";

export function MetricCard({ featured = false, index, metric }: { featured?: boolean; index: number; metric: DashboardMetric }) {
  return (
    <Card className={cn("group relative h-full overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md", featured && "border-slate-950 bg-slate-950 text-white sm:col-span-2")}>
      <div aria-hidden className={cn("absolute inset-x-0 top-0 h-1", metric.barClass)} />
      <CardContent className="flex h-full min-h-48 flex-col justify-between gap-8 pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className={cn("text-[11px] font-bold uppercase tracking-[0.14em]", featured ? "text-amber-400" : metric.accentClass)}>{metric.label}</h2>
            <p className={cn("mt-2 max-w-md text-sm leading-6", featured ? "text-slate-300" : "text-slate-600")}>{metric.description}</p>
          </div>
          <span className={cn("font-mono text-[11px] font-semibold", featured ? "text-slate-500" : "text-slate-400")} aria-hidden>{String(index).padStart(2, "0")}</span>
        </div>

        <div>
          <p aria-label={`${metric.label}: ${metric.displayValue} ${metric.unit}`} className="flex flex-wrap items-baseline gap-x-2">
            <span className={cn("text-5xl font-semibold tracking-[-0.055em] tabular-nums", featured ? "text-white sm:text-6xl" : "text-slate-950")}>{metric.displayValue}</span>
            <span className={cn("text-xs font-bold uppercase tracking-[0.12em]", featured ? "text-slate-400" : "text-slate-500")}>{metric.unit}</span>
          </p>
          <p className={cn("mt-4 border-t pt-3 text-[11px] leading-5", featured ? "border-white/10 text-slate-400" : "border-slate-100 text-slate-500")}>{metric.source}</p>
        </div>
      </CardContent>
    </Card>
  );
}
