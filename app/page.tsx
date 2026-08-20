import { redirect } from "next/navigation";

import { getSessionUser, roleHome } from "@/lib/supabase/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? roleHome(user.profile.role) : "/login");
}
