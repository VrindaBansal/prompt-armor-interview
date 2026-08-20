import type { ReactNode } from "react";

export interface EmptyStateProps {
  action?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}

export function EmptyState({ action, description, eyebrow = "Nothing here yet", title }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-6 py-12 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">{eyebrow}</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
