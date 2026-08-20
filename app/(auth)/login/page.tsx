import Link from "next/link";
import { redirect } from "next/navigation";

import { Field, PendingButton } from "@/components/ui";
import { getSessionUser, roleHome } from "@/lib/supabase/auth";

export const metadata = { title: "Sign in | ClearPath" };

const DEMO_ROLES: { role: string; label: string; blurb: string }[] = [
  { role: "reviewer", label: "Reviewer", blurb: "the queue + AI flags" },
  { role: "submitter", label: "Submitter", blurb: "intake a campaign" },
  { role: "admin", label: "Admin", blurb: "throughput dashboard" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(roleHome(user.profile.role));
  const { error } = await searchParams;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Protected workspace</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Welcome back</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Sign in to submit work, review flagged claims, or monitor throughput.</p>

      {demoMode ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">Demo accounts — one-click sign in</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DEMO_ROLES.map((d) => (
              <form action="/auth/demo" method="post" key={d.role}>
                <input name="role" type="hidden" value={d.role} />
                <button
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left transition hover:border-slate-400 hover:bg-slate-50"
                  type="submit"
                >
                  <span className="block text-sm font-semibold text-slate-950">Sign in as {d.label}</span>
                  <span className="block text-xs text-slate-500">{d.blurb}</span>
                </button>
              </form>
            ))}
          </div>
          <div className="mt-4 border-t border-amber-200/70 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">The 60-second path</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              ClearPath screens marketing copy for compliance before it ships — AI pre-flags
              violations, a human decides, everything is audited. Watch it in one pass:
            </p>
            <ol className="mt-2 grid gap-1 text-xs leading-5 text-slate-700">
              <li><span className="font-semibold">1.</span> Sign in as <span className="font-semibold">Submitter</span> → New submission → “Load sample copy (violating)” → Submit for AI review.</li>
              <li><span className="font-semibold">2.</span> Sign in as <span className="font-semibold">Reviewer</span> → open the top queue item → see the AI flags with excerpts + fixes → confirm/override → decide.</li>
              <li><span className="font-semibold">3.</span> Sign in as <span className="font-semibold">Admin</span> → dashboard → throughput metrics; “Manage rules” to see the ruleset.</li>
            </ol>
          </div>
        </div>
      ) : null}

      {error ? <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}

      <form action="/auth/login" className="mt-8 grid gap-5" method="post">
        <Field autoComplete="email" label="Work email" maxLength={320} name="email" placeholder="name@company.com" required type="email" />
        <Field autoComplete="current-password" label="Password" maxLength={1024} name="password" required type="password" />
        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-600"><input className="size-4 rounded border-slate-300 accent-slate-950" name="remember" type="checkbox" /> Keep me signed in</label>
          <Link className="font-semibold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-800" href="/auth/recover">Forgot password?</Link>
        </div>
        <PendingButton className="mt-1 w-full" pendingLabel="Signing in…" size="lg" type="submit">Sign in</PendingButton>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">New to ClearPath? <Link className="font-semibold text-slate-950 underline decoration-amber-500 decoration-2 underline-offset-4" href="/signup">Create an account</Link></p>
    </div>
  );
}
