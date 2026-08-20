import { Card, CardContent, CardHeader } from "@/components/ui";
import { requireUser } from "@/lib/supabase/auth";

export const metadata = { title: "Dashboard | ClearPath" };

export default async function DashboardShellPage() {
  const user = await requireUser(["admin"]);
  return (
    <main className="min-h-screen bg-[#f3f1eb] px-5 py-10 text-slate-950 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-slate-900/10 pb-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Administrative overview</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">Operations dashboard</h1><p className="mt-2 text-sm text-slate-600">Welcome, {user.profile.full_name || user.email || "administrator"}. Monitor the review system and move directly into the live queue.</p></header>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card><CardHeader><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Review operations</p></CardHeader><CardContent><h2 className="text-xl font-semibold">The live queue is ready</h2><p className="mt-2 text-sm leading-6 text-slate-600">Open Review queue in the navigation to inspect flagged submissions and reviewer decisions.</p></CardContent></Card>
          <Card><CardHeader><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Coming in B6</p></CardHeader><CardContent><h2 className="text-xl font-semibold">Throughput metrics</h2><p className="mt-2 text-sm leading-6 text-slate-600">Median queue time, review velocity, auto-clear rate, revision loops, and AI agreement will populate this surface.</p></CardContent></Card>
        </div>
      </div>
    </main>
  );
}
