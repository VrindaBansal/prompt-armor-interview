"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Role } from "@/lib/types";
import { cn } from "./utils";

const navigation: Record<Role, Array<{ href: string; label: string }>> = {
  submitter: [{ href: "/submissions", label: "My submissions" }, { href: "/submissions/new", label: "New request" }],
  reviewer: [{ href: "/queue", label: "Review queue" }],
  admin: [{ href: "/dashboard", label: "Dashboard" }, { href: "/queue", label: "Review queue" }, { href: "/rules", label: "Rules" }, { href: "/users", label: "Users" }],
};

const roleLabels: Record<Role, string> = { submitter: "Submitter", reviewer: "Reviewer", admin: "Administrator" };

export function AppShell({ children, email, fullName, role }: { children: ReactNode; email: string | null; fullName: string | null; role: Role }) {
  const pathname = usePathname();
  const home = role === "submitter" ? "/submissions" : role === "reviewer" ? "/queue" : "/dashboard";

  return (
    <div className="min-h-screen bg-[#f3f1eb]">
      <a className="sr-only z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2" href="#main-content">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-[#f3f1eb]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-5">
            <Link className="shrink-0 text-sm font-bold uppercase tracking-[0.22em] text-slate-950" href={home}>ClearPath</Link>
            <span aria-hidden className="hidden h-5 w-px bg-slate-900/15 sm:block" />
            <span className="hidden rounded-full border border-slate-900/10 bg-white/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600 sm:inline-flex">{roleLabels[role]}</span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right md:block"><p className="truncate text-xs font-semibold text-slate-900">{fullName || "ClearPath user"}</p><p className="truncate text-[11px] text-slate-500">{email}</p></div>
            <form action="/auth/signout" method="post"><button className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2" type="submit">Sign out</button></form>
          </div>
        </div>
        <nav aria-label="Primary navigation" className="mx-auto flex max-w-[96rem] gap-1 overflow-x-auto px-5 sm:px-8 lg:px-12">
          {navigation[role].map((item) => {
            const active = pathname === item.href || (item.href !== "/submissions" && pathname.startsWith(`${item.href}/`)) || (item.href === "/submissions" && pathname.startsWith("/submissions") && pathname !== "/submissions/new");
            return <Link aria-current={active ? "page" : undefined} className={cn("relative shrink-0 px-3 pb-3 pt-1 text-xs font-semibold transition", active ? "text-slate-950 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-amber-600" : "text-slate-500 hover:text-slate-900")} href={item.href} key={item.href}>{item.label}</Link>;
          })}
        </nav>
      </header>
      <div className="outline-none" id="main-content" tabIndex={-1}>{children}</div>
    </div>
  );
}
