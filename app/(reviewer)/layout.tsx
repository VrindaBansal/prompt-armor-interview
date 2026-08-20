import type { ReactNode } from "react";

import { requireUser } from "@/lib/supabase/auth";

export default async function ReviewerLayout({ children }: { children: ReactNode }) {
  await requireUser(["reviewer", "admin"]);
  return children;
}
