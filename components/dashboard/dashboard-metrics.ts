import type { ThroughputMetrics } from "@/lib/types";

type MetricKey = keyof ThroughputMetrics;

export interface DashboardMetric {
  accentClass: string;
  barClass: string;
  description: string;
  displayValue: string;
  key: MetricKey;
  label: string;
  scaleEnd: string;
  scalePercent: number;
  shortLabel: string;
  source: string;
  unit: string;
  value: number;
}

interface MetricDefinition extends Omit<DashboardMetric, "displayValue" | "scalePercent" | "value"> {
  decimals: number;
  scaleMax: number;
}

const definitions: MetricDefinition[] = [
  {
    key: "medianTimeInQueueHrs",
    label: "Median time in queue",
    shortLabel: "Queue wait",
    unit: "hours",
    decimals: 1,
    description: "Typical elapsed time from AI screening to the next reviewer decision.",
    source: "AI-screened audit event → reviewer decision",
    scaleMax: 48,
    scaleEnd: "48h",
    accentClass: "text-amber-700",
    barClass: "bg-amber-500",
  },
  {
    key: "reviewsPerReviewerPerDay",
    label: "Reviews per reviewer per day",
    shortLabel: "Reviewer pace",
    unit: "reviews / reviewer / day",
    decimals: 2,
    description: "Completed decisions divided across active reviewers and review days.",
    source: "Review decisions ÷ reviewers ÷ active days",
    scaleMax: 5,
    scaleEnd: "5/day",
    accentClass: "text-blue-700",
    barClass: "bg-blue-500",
  },
  {
    key: "pctAutoCleared",
    label: "AI auto-cleared",
    shortLabel: "Auto-clear share",
    unit: "%",
    decimals: 1,
    description: "Screened submissions where the AI found no failing compliance flags.",
    source: "Zero-fail screenings ÷ all screened submissions",
    scaleMax: 100,
    scaleEnd: "100%",
    accentClass: "text-emerald-700",
    barClass: "bg-emerald-500",
  },
  {
    key: "avgRevisionLoops",
    label: "Average revision loops",
    shortLabel: "Revision load",
    unit: "loops",
    decimals: 2,
    description: "Changes-requested decisions per submission that reached human review.",
    source: "Change requests ÷ reviewed submissions",
    scaleMax: 3,
    scaleEnd: "3 loops",
    accentClass: "text-orange-700",
    barClass: "bg-orange-500",
  },
  {
    key: "aiAgreementRate",
    label: "AI agreement rate",
    shortLabel: "Human / AI agreement",
    unit: "%",
    decimals: 1,
    description: "Share of acted-on flags that reviewers confirmed instead of overriding.",
    source: "Confirmed flags ÷ all reviewed flags",
    scaleMax: 100,
    scaleEnd: "100%",
    accentClass: "text-cyan-700",
    barClass: "bg-cyan-500",
  },
];

function formatValue(value: number, decimals: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function buildDashboardMetrics(metrics: ThroughputMetrics): DashboardMetric[] {
  return definitions.map((definition) => {
    const value = metrics[definition.key];
    const scalePercent = Math.min(100, Math.max(0, (value / definition.scaleMax) * 100));

    return {
      ...definition,
      displayValue: formatValue(value, definition.decimals),
      scalePercent,
      value,
    };
  });
}
