import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, Field } from "@/components/ui";
import { getSessionUser, roleHome } from "@/lib/supabase/auth";

export const metadata = { title: "Sign in | ClearPath" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.profile.role));
  const { error } = await searchParams;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Protected workspace</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Welcome back</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to submit work, review flagged claims, or monitor throughput.</p>

      {error ? <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}

      <form action="/auth/login" className="mt-8 grid gap-5" method="post">
        <Field autoComplete="email" label="Work email" name="email" placeholder="name@company.com" required type="email" />
        <Field autoComplete="current-password" label="Password" minLength={8} name="password" required type="password" />
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-600"><input className="size-4 rounded border-slate-300 accent-slate-950" name="remember" type="checkbox" /> Keep me signed in</label>
          <Link className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-800" href="/auth/recover">Forgot password?</Link>
        </div>
        <Button className="mt-1 w-full" size="lg" type="submit">Sign in</Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">New to ClearPath? <Link className="font-semibold text-slate-950 underline decoration-amber-500 decoration-2 underline-offset-4" href="/signup">Create an account</Link></p>
    </div>
  );
}
