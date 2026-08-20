// Feature 13: rules management (admin). Lists the compliance ruleset the AI
// screens against and lets an admin add, edit, and activate/deactivate rules.
import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { listRules } from "@/lib/actions/rules";
import { RulesManager } from "./rules-manager";

export const metadata = { title: "Rules | ClearPath" };

export default async function RulesPage() {
  await requireUser(["admin"]);
  const rules = await listRules();

  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-slate-900/10 pb-8">
          <Link href="/dashboard" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            ← Dashboard
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
            Compliance configuration
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Rules</h1>
          <p className="mt-2 text-sm text-slate-600">
            The ruleset the AI screens submissions against. Deactivated rules stop screening
            immediately; new rules apply to the next submission.
          </p>
        </header>

        <div className="mt-8">
          <RulesManager initialRules={rules} />
        </div>
      </div>
    </main>
  );
}
