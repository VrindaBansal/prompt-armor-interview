import Link from "next/link";

import { SubmissionForm } from "@/components/submission";

import { createSubmissionAction } from "./actions";

export const metadata = { title: "New submission | ClearPath" };

export default async function NewSubmissionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <Link className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-950" href="/submissions">← My submissions</Link>
        <header className="mb-8 mt-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">New review request</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Put the complete claim on record.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Clear context gives the automated screen and human reviewer the same source of truth.</p>
        </header>
        <SubmissionForm action={createSubmissionAction} error={error} />
      </div>
    </main>
  );
}
