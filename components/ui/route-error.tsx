"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "./button";

interface RouteErrorProps {
  contained?: boolean;
  description: string;
  homeHref: string;
  homeLabel: string;
  reset: () => void;
  title: string;
}

export function RouteError({ contained = false, description, homeHref, homeLabel, reset, title }: RouteErrorProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const content = (
    <>
      <div className="w-full max-w-xl rounded-lg border border-red-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-700">Unable to load</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 outline-none" ref={headingRef} tabIndex={-1}>
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2" href={homeHref}>
            {homeLabel}
          </Link>
        </div>
      </div>
    </>
  );

  return contained ? (
    <section aria-label="Account error" className="flex min-h-[70vh] items-center justify-center bg-[#f3f1eb] px-5 py-12">{content}</section>
  ) : (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#f3f1eb] px-5 py-12">{content}</main>
  );
}
