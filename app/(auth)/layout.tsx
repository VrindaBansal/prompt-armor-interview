import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[#f3f1eb] text-slate-950 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.72fr)]">
      <a className="sr-only z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" href="#auth-content">
        Skip to account form
      </a>
      <section className="relative hidden overflow-hidden border-r border-slate-900/10 bg-slate-950 px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
        <Link className="relative z-10 text-sm font-bold uppercase tracking-[0.2em]" href="/">ClearPath</Link>

        <div className="relative z-10 max-w-xl pb-10">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
            <span className="h-px w-10 bg-amber-400" /> Review operations
          </p>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.04em] xl:text-6xl">
            Every claim accounted for. Every decision traceable.
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-slate-300">
            ClearPath turns scattered marketing reviews into one defensible record—from first draft through final approval.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/15 pt-6 text-xs text-slate-400">
          <span>Structured intake</span>
          <span>AI pre-screening</span>
          <span>Complete audit trail</span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10" id="auth-content" tabIndex={-1}>
        <div className="w-full max-w-md">
          <Link className="mb-12 inline-flex text-sm font-bold uppercase tracking-[0.2em] lg:hidden" href="/">ClearPath</Link>
          {children}
        </div>
      </section>
    </main>
  );
}
