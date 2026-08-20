import Link from "next/link";

import { SubmissionList } from "@/components/submission";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { Status, Submission } from "@/lib/types";

export const metadata = { title: "My submissions | ClearPath" };

const activeStatuses: Status[] = ["pending_ai", "ai_screened", "in_review"];

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const [user, params] = await Promise.all([requireUser(["submitter"]), searchParams]);
  const supabase = await createClient();
  const { data, error } = await supabase.from("submissions").select("*").order("updated_at", { ascending: false });
  if (error) throw new Error("Unable to load submissions");
  const submissions = (data ?? []) as Submission[];
  const activeCount = submissions.filter((item) => activeStatuses.includes(item.status)).length;
  const approvedCount = submissions.filter((item) => item.status === "approved").length;

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-6 border-b border-slate-900/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Submitter workspace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">My submissions</h1>
            <p className="mt-2 text-sm text-slate-600">Welcome back, {user.profile.full_name || user.email || "submitter"}.</p>
          </div>
          <Link className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800" href="/submissions/new">New submission</Link>
        </header>

        {params.created ? <div className={`mt-6 rounded-md border px-4 py-3 text-sm font-medium ${params.created === "screening_failed" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="status">{params.created === "submitted" ? "Submission screened and sent to the review queue." : params.created === "screening_failed" ? "Your draft was saved, but AI screening could not start. Try submitting it again shortly." : "Draft saved successfully."}</div> : null}

        <section aria-label="Submission summary" className="grid grid-cols-3 border-b border-slate-900/10 py-7">
          <div><p className="text-2xl font-semibold tracking-tight">{submissions.length}</p><p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Total</p></div>
          <div className="border-l border-slate-900/10 pl-6"><p className="text-2xl font-semibold tracking-tight">{activeCount}</p><p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">In progress</p></div>
          <div className="border-l border-slate-900/10 pl-6"><p className="text-2xl font-semibold tracking-tight">{approvedCount}</p><p className="mt-1 text-xs uppercase tracking-[0.1em] text-slate-500">Approved</p></div>
        </section>

        <section className="mt-7"><SubmissionList submissions={submissions} /></section>
      </div>
    </main>
  );
}
