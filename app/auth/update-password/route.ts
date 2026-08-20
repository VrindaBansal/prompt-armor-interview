import { createClient } from "@/lib/supabase/server";

import { authRedirect, rawFormValue, rejectCrossOrigin } from "../utils";

export async function POST(request: Request) {
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const formData = await request.formData();
  const password = rawFormValue(formData, "password");
  const confirmation = rawFormValue(formData, "password_confirmation");
  if (password.length < 12 || password.length > 1024 || password !== confirmation) {
    return authRedirect(request, "/update-password", "Passwords must match and contain at least 12 characters.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return authRedirect(request, "/update-password", "We could not update your password. Request a new recovery link.");
  return authRedirect(request, "/");
}
