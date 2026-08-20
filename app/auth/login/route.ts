import type { Role } from "@/lib/types";
import { roleHome } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { authRedirect, formValue } from "../utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!email || !password) return authRedirect(request, "/login", "Enter your email and password.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return authRedirect(request, "/login", "The email or password is incorrect.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (!profile) {
    await supabase.auth.signOut();
    return authRedirect(request, "/login", "Your account profile is not ready. Contact an administrator.");
  }

  return authRedirect(request, roleHome(profile.role as Role));
}
