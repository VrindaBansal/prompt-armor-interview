import { createClient } from "@/lib/supabase/server";

import { appUrl, authRedirect, formValue, rejectCrossOrigin } from "../utils";

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const formData = await request.formData();
  const email = formValue(formData, "email");
  if (!email || email.length > 320) {
    return authRedirect(request, "/auth/recover", "Enter your work email.");
  }

  const supabase = await createClient();
  const callbackUrl = appUrl("/auth/callback");
  callbackUrl.searchParams.set("next", "/update-password");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl.toString() });

  return authRedirect(request, "/auth/recover?sent=1");
}
