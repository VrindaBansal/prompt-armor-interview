import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, Field } from "@/components/ui";
import { getSessionUser, roleHome } from "@/lib/supabase/auth";

export const metadata = { title: "Create account | ClearPath" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.profile.role));
  const { error } = await searchParams;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Submitter access</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Create your workspace account</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">New accounts begin with submitter access. An administrator can update your role later.</p>

      {error ? <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}

      <form action="/auth/signup" className="mt-8 grid gap-5" method="post">
        <Field autoComplete="name" label="Full name" name="full_name" placeholder="Alex Morgan" required />
        <Field autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        <Field autoComplete="new-password" hint="Use at least 8 characters." label="Password" minLength={8} name="password" required type="password" />
        <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input className="mt-1 size-4 shrink-0 rounded border-slate-300 accent-slate-950" name="terms" required type="checkbox" /> <span>I agree to use ClearPath for authorized compliance review work.</span></label>
        <Button className="mt-1 w-full" size="lg" type="submit">Create account</Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-slate-950 underline decoration-amber-500 decoration-2 underline-offset-4" href="/login">Sign in</Link></p>
    </div>
  );
}
