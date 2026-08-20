// Read-only AI flag display (A3). Renders each ai_check with its rule citation,
// highlighted excerpt, explanation, and suggested fix. Confirm/override controls
// are added in A4 (components/review/flag-controls).
import { Badge, Card, CardContent, SeverityTag } from "@/components/ui";
import type { AiCheckWithRule, Verdict } from "@/lib/types";

const verdictOrder: Record<Verdict, number> = { fail: 0, needs_human: 1, pass: 2 };
const verdictMeta: Record<Verdict, { label: string; tone: "danger" | "warning" | "success" }> = {
  fail: { label: "Fail", tone: "danger" },
  needs_human: { label: "Needs human", tone: "warning" },
  pass: { label: "Pass", tone: "success" },
};

export function FlagList({ checks }: { checks: AiCheckWithRule[] }) {
  if (checks.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No AI checks recorded for this submission yet.
      </p>
    );
  }

  const sorted = [...checks].sort(
    (a, b) => verdictOrder[a.verdict] - verdictOrder[b.verdict],
  );

  return (
    <ul className="grid gap-3">
      {sorted.map((check) => {
        const meta = verdictMeta[check.verdict];
        return (
          <li key={check.id}>
            <Card className={check.verdict === "fail" ? "border-red-200" : undefined}>
              <CardContent className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <SeverityTag severity={check.rule.severity} />
                  <span className="text-xs font-semibold tracking-[0.04em] text-slate-700">
                    {check.rule.code}
                  </span>
                  <Badge tone="neutral">{check.rule.regulation}</Badge>
                  {check.confidence != null ? (
                    <span className="ml-auto text-xs text-slate-500">
                      confidence {Math.round(check.confidence * 100)}%
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-slate-700">{check.rule.description}</p>

                {check.excerpt ? (
                  <blockquote className="border-l-2 border-amber-400 bg-amber-50/60 px-3 py-2 text-sm text-slate-900">
                    “{check.excerpt}”
                  </blockquote>
                ) : null}

                {check.explanation ? (
                  <p className="text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-900">Why: </span>
                    {check.explanation}
                  </p>
                ) : null}

                {check.suggested_fix ? (
                  <p className="text-sm leading-6 text-emerald-900">
                    <span className="font-semibold">Suggested fix: </span>
                    {check.suggested_fix}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
