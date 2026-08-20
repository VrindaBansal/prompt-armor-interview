// Reviewer queue (A3, features 3). Server component: lists items awaiting
// review, sorted by severity then age via listQueue (RLS-scoped).
import { EmptyState } from "@/components/ui";
import { QueueList } from "@/components/review";
import { requireUser } from "@/lib/supabase/auth";
import { listQueue } from "@/lib/actions/submissions";

export const metadata = { title: "Review queue | ClearPath" };

export default async function QueuePage() {
  const user = await requireUser(["reviewer", "admin"]);
  const items = await listQueue();

  const blockers = items.filter((i) => i.max_severity === "blocker").length;

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-slate-900/10 pb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Reviewer workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Review queue</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome, {user.profile.full_name || user.email || "reviewer"}. Highest-severity
            items first.
          </p>
        </header>

        <section aria-label="Queue summary" className="grid grid-cols-2 border-b border-slate-900/10 py-7 sm:grid-cols-3">
          <div>
            <p className="text-2xl font-semibold tracking-tight">{items.length}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Awaiting review</p>
          </div>
          <div className="border-l border-slate-900/10 pl-6">
            <p className="text-2xl font-semibold tracking-tight">{blockers}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">With blockers</p>
          </div>
        </section>

        <div className="mt-7">
          {items.length === 0 ? (
            <EmptyState
              eyebrow="Queue clear"
              title="Nothing to review"
              description="New submissions appear here after AI screening completes."
            />
          ) : (
            <QueueList items={items} />
          )}
        </div>
      </div>
    </main>
  );
}
