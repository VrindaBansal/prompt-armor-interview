import Link from "next/link";

import { EmptyState } from "@/components/ui";

export default function ReviewNotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f3f1eb] px-5">
      <div className="w-full max-w-xl">
        <EmptyState
          action={<Link className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2" href="/queue">Return to review queue</Link>}
          description="This submission may no longer be in the queue, or your account may not have permission to review it."
          eyebrow="Record unavailable"
          title="Review record not found"
        />
      </div>
    </main>
  );
}
