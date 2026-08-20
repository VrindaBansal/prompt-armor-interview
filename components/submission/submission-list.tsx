import type { Channel, ProductType, Submission } from "@/lib/types";
import { Card, CardContent, EmptyState, StatusPill } from "@/components/ui";

const channelLabels: Record<Channel, string> = {
  ad: "Advertisement",
  email: "Email",
  affiliate_landing: "Affiliate landing",
  social: "Social media",
};

const productLabels: Record<ProductType, string> = {
  personal_loan: "Personal loan",
  credit_card: "Credit card",
  mortgage_prequal: "Mortgage prequalification",
};

const formatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function SubmissionList({ submissions }: { submissions: Submission[] }) {
  if (!submissions.length) {
    return <EmptyState action={<Link className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800" href="/submissions/new">Create submission</Link>} description="Create a structured campaign record to start the compliance review process." eyebrow="Queue ready" title="No submissions yet" />;
  }

  return (
    <div className="grid gap-3">
      {submissions.map((submission) => (
        <Card className="transition hover:border-slate-300 hover:shadow-md" key={submission.id}>
          <CardContent className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-base font-semibold text-slate-950">{submission.title}</h2>
                <StatusPill status={submission.status} />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-slate-500">
                <span>{productLabels[submission.product_type]}</span><span aria-hidden>·</span>
                <span>{channelLabels[submission.channel]}</span><span aria-hidden>·</span>
                <span>Updated {formatter.format(new Date(submission.updated_at))}</span>
              </p>
              <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">{submission.content}</p>
            </div>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-500 hover:bg-slate-50" href={`/submissions/${submission.id}`}>Open record</Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
import Link from "next/link";
