import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "./utils";

interface FieldShellProps {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
  name: string;
  required?: boolean;
}

function FieldShell({ children, error, hint, label, name, required }: FieldShellProps) {
  const descriptionId = error || hint ? `${name}-description` : undefined;
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-semibold text-slate-900" htmlFor={name}>
        {label}{required ? <span className="ml-1 text-red-700" aria-hidden>*</span> : null}
      </label>
      {children}
      {error || hint ? <p className={cn("text-xs leading-5", error ? "font-medium text-red-700" : "text-slate-500")} id={descriptionId} role={error ? "alert" : undefined}>{error || hint}</p> : null}
    </div>
  );
}

const controlClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-700 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  error?: string;
  hint?: string;
  label: string;
  name: string;
}

export function Field({ className, error, hint, label, name, required, ...props }: FieldProps) {
  return <FieldShell error={error} hint={hint} label={label} name={name} required={required}><input aria-describedby={error || hint ? `${name}-description` : undefined} aria-invalid={Boolean(error)} className={cn(controlClass, error && "border-red-500 focus:border-red-700 focus:ring-red-100", className)} id={name} name={name} required={required} {...props} /></FieldShell>;
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {
  error?: string;
  hint?: string;
  label: string;
  name: string;
}

export function TextArea({ className, error, hint, label, name, required, rows = 6, ...props }: TextAreaProps) {
  return <FieldShell error={error} hint={hint} label={label} name={name} required={required}><textarea aria-describedby={error || hint ? `${name}-description` : undefined} aria-invalid={Boolean(error)} className={cn(controlClass, "resize-y", error && "border-red-500 focus:border-red-700 focus:ring-red-100", className)} id={name} name={name} required={required} rows={rows} {...props} /></FieldShell>;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  error?: string;
  hint?: string;
  label: string;
  name: string;
}

export function Select({ children, className, error, hint, label, name, required, ...props }: SelectProps) {
  return <FieldShell error={error} hint={hint} label={label} name={name} required={required}><select aria-describedby={error || hint ? `${name}-description` : undefined} aria-invalid={Boolean(error)} className={cn(controlClass, error && "border-red-500 focus:border-red-700 focus:ring-red-100", className)} id={name} name={name} required={required} {...props}>{children}</select></FieldShell>;
}
