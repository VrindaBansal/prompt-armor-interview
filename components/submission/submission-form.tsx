import Link from "next/link";

import { Button, Card, CardContent, CardFooter, CardHeader, Field, Select, TextArea } from "@/components/ui";

export function SubmissionForm({ action, error }: { action: (formData: FormData) => void | Promise<void>; error?: string }) {
  return (
    <form action={action}>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">Campaign record</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Submission details</h2>
          </div>
          <p className="text-xs text-slate-500"><span className="font-semibold text-red-700">*</span> Required fields</p>
        </CardHeader>
        <CardContent className="grid gap-6">
          {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}
          <Field hint="Use a name reviewers can recognize in the queue." label="Campaign title" maxLength={120} name="title" placeholder="Q4 personal loan email" required />
          <div className="grid gap-6 md:grid-cols-2">
            <Select defaultValue="" label="Channel" name="channel" required>
              <option disabled value="">Select a channel</option>
              <option value="ad">Advertisement</option>
              <option value="email">Email</option>
              <option value="affiliate_landing">Affiliate landing page</option>
              <option value="social">Social media</option>
            </Select>
            <Select defaultValue="" label="Product" name="product_type" required>
              <option disabled value="">Select a product</option>
              <option value="personal_loan">Personal loan</option>
              <option value="credit_card">Credit card</option>
              <option value="mortgage_prequal">Mortgage prequalification</option>
            </Select>
          </div>
          <TextArea hint="Paste the exact customer-facing copy. Formatting can be plain text." label="Marketing content" maxLength={12000} minLength={20} name="content" placeholder="Enter the full campaign copy reviewers should evaluate…" required rows={12} />
          <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
            <input className="mt-1 size-4 shrink-0 rounded border-slate-300 accent-slate-950" name="is_affiliate" type="checkbox" />
            <span><span className="block font-semibold text-slate-950">Affiliate content</span>This copy will be distributed or published by a third-party affiliate.</span>
          </label>
        </CardContent>
        <CardFooter className="flex-col-reverse justify-between gap-3 bg-slate-50/70 sm:flex-row">
          <Link className="inline-flex min-h-10 items-center justify-center px-2 text-sm font-semibold text-slate-600 hover:text-slate-950" href="/submissions">Cancel</Link>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button className="w-full sm:w-auto" name="intent" type="submit" value="draft" variant="secondary">Save draft</Button>
            <Button className="w-full sm:w-auto" name="intent" type="submit" value="submit">Submit for AI review</Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
