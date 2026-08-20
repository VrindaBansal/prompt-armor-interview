"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createSubmission, submitForReview } from "@/lib/actions/submissions";
import type { Channel, NewSubmission, ProductType } from "@/lib/types";

const channels = new Set<Channel>(["ad", "email", "affiliate_landing", "social"]);
const products = new Set<ProductType>(["personal_loan", "credit_card", "mortgage_prequal"]);

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function createSubmissionAction(formData: FormData) {
  const title = value(formData, "title");
  const content = value(formData, "content");
  const channel = value(formData, "channel") as Channel;
  const productType = value(formData, "product_type") as ProductType;
  const intent = value(formData, "intent");

  if (!title || title.length > 120 || content.length < 20 || content.length > 12000 || !channels.has(channel) || !products.has(productType)) {
    redirect("/submissions/new?error=Complete+all+required+fields+before+saving.");
  }

  const input: NewSubmission = { title, channel, product_type: productType, content, is_affiliate: formData.get("is_affiliate") === "on" };
  let submissionId: string;
  try {
    const submission = await createSubmission(input);
    submissionId = submission.id;
  } catch {
    redirect("/submissions/new?error=The+submission+service+is+temporarily+unavailable.+Your+work+was+not+saved.");
  }

  if (intent === "submit") {
    try {
      await submitForReview(submissionId);
    } catch {
      redirect(`/submissions?created=screening_failed&id=${submissionId}`);
    }
  }

  revalidatePath("/submissions");
  redirect(`/submissions?created=${intent === "submit" ? "submitted" : "draft"}&id=${submissionId}`);
}
