import type { ReactNode } from "react";

import { AppShell } from "@/components/ui";
import { requireUser } from "@/lib/supabase/auth";

export default async function SubmitterLayout({ children }: { children: ReactNode }) {
  const user = await requireUser(["submitter"]);
  return <AppShell email={user.email} fullName={user.profile.full_name} role={user.profile.role}>{children}</AppShell>;
}
