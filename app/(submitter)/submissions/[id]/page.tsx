import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentThread, ScreeningSummary } from "@/components/submission";
import { Badge, Card, CardContent, CardHeader, LocalDateTime, PendingButton, StatusPill } from "@/components/ui";
import { getSubmissionDetail } from "@/lib/actions/submissions";
import { requireUser } from "@/lib/supabase/auth";
import type { Channel, ProductType, Status, SubmissionDetail } from "@/lib/types";

import { submitExistingForReviewAction } from "./actions";

const channelLabels: Record<Channel, string> = { ad: "Advertisement", email: "Email", affiliate_landing: "Affiliate landing page", social: "Social media" };
const productLabels: Record<ProductType, string> = { personal_loan: "Personal loan", credit_card: "Credit card", mortgage_prequal: "Mortgage prequalification" };
const completedScreeningStatuses = new Set<Status>(["ai_screened", "in_review", "approved", "changes_requested", "rejected"]);
export default async function SubmissionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ screening?: string }> }) {
  const [{ id }, query, user] = await Promise.all([params, searchParams, requireUser(["submitter"])]);
  let submission: SubmissionDetail;
  try {
    submission = await getSubmissionDetail(id);
  } catch {
    notFound();
  }
  const canSubmit = submission.status === "draft" || submission.status === "changes_requested";
  const issueCount = submission.ai_checks.filter((check) => check.verdict !== "pass").length;

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-950" href="/submissions">← My submissions</Link>
        <header className="mt-6 flex flex-col gap-6 border-b border-slate-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3"><StatusPill status={submission.status} />{submission.is_affiliate ? <Badge tone="warning">Affiliate</Badge> : null}</div>
            <h1 className="mt-4 break-words text-4xl font-semibold tracking-[-0.035em]">{submission.title}</h1>
            <p className="mt-2 text-sm text-slate-500">{productLabels[submission.product_type]} · {channelLabels[submission.channel]} · Updated <LocalDateTime value={submission.updated_at} /></p>
          </div>
          {canSubmit ? <form action={submitExistingForReviewAction}><input name="submission_id" type="hidden" value={submission.id} /><PendingButton pendingLabel="Screening…" size="lg" type="submit">Submit for AI review</PendingButton></form> : null}
        </header>

        {query.screening ? <div className={`mt-6 rounded-md border px-4 py-3 text-sm font-medium ${query.screening === "complete" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`} role="status">{query.screening === "complete" ? "AI screening completed and the record is ready for review." : "AI screening could not complete. The submission remains saved; try again shortly."}</div> : null}

        {completedScreeningStatuses.has(submission.status) ? <div className="mt-6"><ScreeningSummary checks={submission.ai_checks} /></div> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,.75fr)]">
          <div className="grid content-start gap-6">
            <Card>
              <CardHeader><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Customer-facing copy</p><h2 className="mt-1 text-lg font-semibold">Submitted content</h2></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-800">{submission.content}</p></CardContent>
            </Card>
            {submission.reviews.some((review) => review.notes) ? <Card><CardHeader><h2 className="text-lg font-semibold">Reviewer decision notes</h2></CardHeader><CardContent className="grid gap-4">{submission.reviews.filter((review) => review.notes).map((review) => <blockquote className="border-l-2 border-amber-500 pl-4 text-sm leading-6 text-slate-700" key={review.id}>{review.notes}</blockquote>)}</CardContent></Card> : null}
            <CommentThread initialComments={submission.comments} submissionId={submission.id} userId={user.id} />
          </div>

          <aside className="grid content-start gap-4">
            <Card><CardHeader><h2 className="text-sm font-semibold">Review snapshot</h2></CardHeader><CardContent className="grid gap-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Rules checked</span><strong>{submission.ai_checks.length}</strong></div><div className="flex justify-between"><span className="text-slate-500">Potential issues</span><strong>{issueCount}</strong></div><div className="flex justify-between"><span className="text-slate-500">Review decisions</span><strong>{submission.reviews.length}</strong></div><div className="flex justify-between"><span className="text-slate-500">Comments</span><strong>{submission.comments.length}</strong></div></CardContent></Card>
            <div className="rounded-lg border border-slate-900/10 bg-slate-950 px-5 py-5 text-white"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-400">Record integrity</p><p className="mt-2 text-sm leading-6 text-slate-300">Decisions, transitions, and comments are retained in the audit history for this submission.</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
