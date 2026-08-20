import type { ReactNode } from "react";

import { requireUser } from "@/lib/supabase/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireUser(["admin"]);
  return children;
}
