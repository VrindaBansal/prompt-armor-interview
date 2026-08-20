import { createClient } from "@/lib/supabase/server";

import { authRedirect } from "../utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return authRedirect(request, "/login");
}
