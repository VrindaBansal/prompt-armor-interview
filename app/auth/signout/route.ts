import { createClient } from "@/lib/supabase/server";

import { authRedirect, rejectCrossOrigin } from "../utils";

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const supabase = await createClient();
  await supabase.auth.signOut();
  return authRedirect(request, "/login");
}
