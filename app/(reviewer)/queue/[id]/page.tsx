// Reviewer detail view (A3, features 4-5). Content | context | applicable
// rules on one screen, with the decision bar. Reaching a decision is one click
// (decideReview works from ai_screened or in_review).
import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Badge, Button, Card, CardContent, CardHeader, StatusPill } from "@/components/ui";
import { DecisionBar, FlagList } from "@/components/review";
import { requireUser } from "@/lib/supabase/auth";
import { getSubmissionDetail, startReview } from "@/lib/actions/submissions";
import type { SubmissionDetail } from "@/lib/types";

const OPEN_STATUSES = new Set(["ai_screened", "in_review"]);

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["reviewer", "admin"]);
  const { id } = await params;

  let detail: SubmissionDetail;
  try {
    detail = await getSubmissionDetail(id);
  } catch {
    notFound();
  }

  const fails = detail.ai_checks.filter((c) => c.verdict === "fail").length;
  const decidable = OPEN_STATUSES.has(detail.status);

  async function claim() {
    "use server";
    await startReview(id);
    revalidatePath(`/queue/${id}`);
  }

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/queue" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
          ← Back to queue
        </Link>

        <header className="mt-4 flex flex-col gap-4 border-b border-slate-900/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Review detail
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{detail.title}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {detail.submitter_name ?? "Unknown submitter"} · {detail.channel} ·{" "}
              {detail.product_type}
              {detail.is_affiliate ? " · affiliate" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={fails > 0 ? "danger" : "success"}>
              {fails} {fails === 1 ? "flag" : "flags"}
            </Badge>
            <StatusPill status={detail.status} />
          </div>
        </header>

        <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: the content under review */}
          <section aria-label="Submission content" className="grid gap-6">
            <Card>
              <CardHeader className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Marketing copy
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-900">
                  {detail.content}
                </p>
              </CardContent>
            </Card>

            {detail.reviews.length > 0 ? (
              <Card>
                <CardHeader className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  Decision history
                </CardHeader>
                <CardContent className="grid gap-3">
                  {detail.reviews.map((r) => (
                    <div key={r.id} className="text-sm">
                      <StatusPill status={r.decision} />
                      {r.notes ? (
                        <p className="mt-1 text-slate-700">{r.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </section>

          {/* Right: AI context + decision */}
          <section aria-label="AI context and decision" className="grid gap-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  AI compliance flags
                </span>
              </CardHeader>
              <CardContent>
                <FlagList checks={detail.ai_checks} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                Decision
              </CardHeader>
              <CardContent>
                {decidable ? (
                  <div className="grid gap-4">
                    {detail.status === "ai_screened" ? (
                      <form action={claim}>
                        <Button variant="ghost" size="sm" type="submit">
                          Mark as in review
                        </Button>
                      </form>
                    ) : null}
                    <DecisionBar submissionId={detail.id} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    This submission is <strong>{detail.status.replace("_", " ")}</strong> and is
                    not awaiting a decision.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
