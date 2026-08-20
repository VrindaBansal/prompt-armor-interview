import { Field, PendingButton } from "@/components/ui";

export const metadata = { title: "Choose a new password | ClearPath" };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Secure recovery</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">Choose a new password</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Use at least 8 characters and avoid passwords used for other services.</p>
      {error ? <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{error}</div> : null}
      <form action="/auth/update-password" className="mt-8 grid gap-5" method="post">
        <Field autoComplete="new-password" label="New password" minLength={8} name="password" required type="password" />
        <Field autoComplete="new-password" label="Confirm new password" minLength={8} name="password_confirmation" required type="password" />
        <PendingButton className="w-full" pendingLabel="Updating password…" size="lg" type="submit">Update password</PendingButton>
      </form>
    </div>
  );
}
