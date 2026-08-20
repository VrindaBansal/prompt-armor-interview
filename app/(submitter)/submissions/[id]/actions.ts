"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addComment, submitForReview } from "@/lib/actions/submissions";

export interface CommentActionState {
  error: string | null;
  success: boolean;
}

export async function addSubmissionCommentAction(_state: CommentActionState, formData: FormData): Promise<CommentActionState> {
  const submissionId = formData.get("submission_id");
  const body = formData.get("body");
  if (typeof submissionId !== "string" || typeof body !== "string" || !body.trim()) {
    return { error: "Write a comment before posting.", success: false };
  }
  if (body.trim().length > 2000) return { error: "Comments must be 2,000 characters or fewer.", success: false };

  try {
    await addComment(submissionId, body);
    revalidatePath(`/submissions/${submissionId}`);
    return { error: null, success: true };
  } catch {
    return { error: "Your comment could not be posted. Refresh and try again.", success: false };
  }
}

export async function submitExistingForReviewAction(formData: FormData) {
  const submissionId = formData.get("submission_id");
  if (typeof submissionId !== "string") redirect("/submissions");
  try {
    await submitForReview(submissionId);
  } catch {
    redirect(`/submissions/${submissionId}?screening=failed`);
  }
  revalidatePath(`/submissions/${submissionId}`);
  redirect(`/submissions/${submissionId}?screening=complete`);
}
