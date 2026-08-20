import { createClient } from "@/lib/supabase/server";

import { authRedirect, formValue } from "../utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formValue(formData, "email");
  if (!email) return authRedirect(request, "/auth/recover", "Enter your work email.");

  const supabase = await createClient();
  const callbackUrl = new URL("/auth/callback", request.url);
  callbackUrl.searchParams.set("next", "/update-password");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl.toString() });

  return authRedirect(request, "/auth/recover?sent=1");
}
