import type { ReactNode } from "react";

import { requireUser } from "@/lib/supabase/auth";

export default async function SubmitterLayout({ children }: { children: ReactNode }) {
  await requireUser(["submitter"]);
  return children;
}
