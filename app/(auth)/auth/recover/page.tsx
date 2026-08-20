import Link from "next/link";

import { Button, Field } from "@/components/ui";

export const metadata = { title: "Reset password | ClearPath" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { error, sent } = await searchParams;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Account recovery</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Reset your password</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Enter your work email and we’ll send a secure recovery link.</p>
      {error ? <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}
      {sent ? <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">If an account exists for that email, a recovery link is on its way.</div> : null}
      <form action="/auth/forgot-password" className="mt-8 grid gap-5" method="post">
        <Field autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        <Button className="w-full" size="lg" type="submit">Send recovery link</Button>
      </form>
      <p className="mt-8 text-center text-sm"><Link className="font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4" href="/login">Return to sign in</Link></p>
    </div>
  );
}
