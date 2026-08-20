import Link from "next/link";

import { EmptyState } from "@/components/ui";

export default function SubmissionNotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f3f1eb] px-5"><div className="w-full max-w-xl"><EmptyState action={<Link className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white" href="/submissions">Return to submissions</Link>} description="This submission may have been removed, or your account may not have permission to view it." eyebrow="Record unavailable" title="Submission not found" /></div></main>;
}
