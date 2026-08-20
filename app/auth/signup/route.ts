import type { Role } from "@/lib/types";
import { roleHome } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { authRedirect, formValue } from "../utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fullName = formValue(formData, "full_name");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const acceptedTerms = formData.get("terms") === "on";

  if (!fullName || !email || password.length < 8 || !acceptedTerms) {
    return authRedirect(request, "/signup", "Complete every field and use a password of at least 8 characters.");
  }

  const supabase = await createClient();
  const emailRedirectTo = new URL("/auth/callback", request.url).toString();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo },
  });
  if (error) return authRedirect(request, "/signup", "We could not create that account. Try another email or contact support.");
  if (!data.session || !data.user) return authRedirect(request, "/login", "Check your email to confirm your account, then sign in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  return authRedirect(request, roleHome((profile?.role ?? "submitter") as Role));
}
