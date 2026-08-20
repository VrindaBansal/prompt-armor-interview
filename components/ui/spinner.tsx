import { cn } from "./utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600" role="status">
      <span aria-hidden className={cn("size-4 animate-spin rounded-full border-2 border-slate-300 border-r-slate-800", className)} />
      <span>{label}</span>
    </span>
  );
}
