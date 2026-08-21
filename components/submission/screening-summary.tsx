import { Badge, Card, CardContent, CardHeader, SeverityTag } from "@/components/ui";
import type { AiCheckWithRule, Verdict } from "@/lib/types";

const issueMeta: Record<Exclude<Verdict, "pass">, { label: string; tone: "danger" | "warning" }> = {
  fail: { label: "Potential violation", tone: "danger" },
  needs_human: { label: "Needs human review", tone: "warning" },
};

export function ScreeningSummary({ checks }: { checks: AiCheckWithRule[] }) {
  const issues = checks.filter((check) => check.verdict !== "pass");
  const passed = checks.length - issues.length;
  const issueLabel = `${issues.length} potential ${issues.length === 1 ? "issue" : "issues"}`;

  return (
    <Card aria-labelledby="screening-results-title" className={issues.length ? "border-amber-200" : "border-emerald-200"}>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">AI screening results</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950" id="screening-results-title">
            Compliance AI checked {checks.length} {checks.length === 1 ? "rule" : "rules"} and found {issueLabel}.
          </h2>
        </div>
        <Badge className="shrink-0" tone={issues.length ? "warning" : "success"}>
          {issues.length ? "Issues found — pending reviewer" : "Cleared — pending reviewer"}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className={`rounded-md border px-4 py-3 text-sm leading-6 ${issues.length ? "border-amber-200 bg-amber-50 text-amber-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
          <span className="font-semibold">Automated screen only.</span>{" "}
          This result is not an approval or rejection. A human reviewer makes the final decision.
        </div>

        {issues.length ? (
          <ol className="grid gap-4">
            {issues.map((check) => {
              const meta = issueMeta[check.verdict as Exclude<Verdict, "pass">];
              return (
                <li className="rounded-md border border-slate-200 bg-slate-50/70 p-4" key={check.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <SeverityTag severity={check.rule.severity} />
                    <span className="text-xs font-bold tracking-[0.04em] text-slate-800">{check.rule.code}</span>
                    <span className="text-xs text-slate-500">{check.rule.regulation}</span>
                  </div>

                  <p className="mt-3 text-sm font-medium leading-6 text-slate-900">{check.rule.description}</p>

                  {check.excerpt ? (
                    <blockquote className="mt-3 border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm leading-6 text-slate-900">
                      “{check.excerpt}”
                    </blockquote>
                  ) : null}

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">AI explanation: </span>
                    {check.explanation}
                  </p>

                  {check.suggested_fix ? (
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      <span className="font-semibold">AI suggested fix: </span>
                      {check.suggested_fix}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm leading-6 text-emerald-900">
            No potential compliance issues were identified in this automated screen.
          </p>
        )}

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-emerald-800">{passed} {passed === 1 ? "rule passed" : "rules passed"}</p>
          <p className="text-slate-500">AI feedback is advisory until reviewer action.</p>
        </div>
      </CardContent>
    </Card>
  );
}
