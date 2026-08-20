"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import type { Comment } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardContent, CardHeader, EmptyState } from "@/components/ui";
import type { CommentActionState } from "@/app/(submitter)/submissions/[id]/actions";
import { addSubmissionCommentAction } from "@/app/(submitter)/submissions/[id]/actions";

const initialState: CommentActionState = { error: null, success: false };
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function PostButton() {
  const { pending } = useFormStatus();
  return <Button disabled={pending} type="submit">{pending ? "Posting…" : "Post comment"}</Button>;
}

export function CommentThread({ initialComments, submissionId, userId }: { initialComments: Comment[]; submissionId: string; userId: string }) {
  const [realtimeComments, setRealtimeComments] = useState<Comment[]>([]);
  const [state, formAction] = useActionState(addSubmissionCommentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const comments = [...initialComments, ...realtimeComments.filter((incoming) => !initialComments.some((item) => item.id === incoming.id))];

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`submission-comments:${submissionId}`).on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "comments", filter: `submission_id=eq.${submissionId}` },
      (payload) => {
        const comment = payload.new as Comment;
        setRealtimeComments((current) => current.some((item) => item.id === comment.id) ? current : [...current, comment]);
      },
    ).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [submissionId]);

  return (
    <Card>
      <CardHeader>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Shared record</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Review conversation</h2>
      </CardHeader>
      <CardContent className="grid gap-6">
        {comments.length ? (
          <ol aria-live="polite" className="grid gap-5">
            {comments.map((comment) => {
              const own = comment.author_id === userId;
              return (
                <li className={`relative border-l-2 pl-5 ${own ? "border-slate-950" : "border-amber-500"}`} key={comment.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">{own ? "You" : "Reviewer"}</p>
                    <time className="text-[11px] uppercase tracking-[0.08em] text-slate-400" dateTime={comment.created_at}>{dateFormatter.format(new Date(comment.created_at))}</time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.body}</p>
                </li>
              );
            })}
          </ol>
        ) : <EmptyState description="Use this thread to keep questions, requested changes, and clarifications attached to the submission." eyebrow="Conversation open" title="No comments yet" />}

        <form action={formAction} className="grid gap-3 border-t border-slate-100 pt-5" ref={formRef}>
          <input name="submission_id" type="hidden" value={submissionId} />
          <label className="text-sm font-semibold text-slate-950" htmlFor="comment-body">Add a comment</label>
          <textarea aria-describedby="comment-hint" className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200" id="comment-body" maxLength={2000} name="body" placeholder="Add context or respond to reviewer feedback…" required />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-xs ${state.error ? "font-medium text-red-700" : "text-slate-500"}`} id="comment-hint" role={state.error ? "alert" : undefined}>{state.error || "Comments become part of the submission’s audit history."}</p>
            <PostButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
