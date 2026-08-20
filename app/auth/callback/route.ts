import type { Role } from "@/lib/types";
import { roleHome } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { authRedirect, safeNextPath } from "../utils";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  if (!code) return authRedirect(request, "/login", "The authentication link is invalid or expired.");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return authRedirect(request, "/login", "The authentication link is invalid or expired.");
  if (next) return authRedirect(request, safeNextPath(next));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return authRedirect(request, "/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return authRedirect(request, roleHome((profile?.role ?? "submitter") as Role));
}
