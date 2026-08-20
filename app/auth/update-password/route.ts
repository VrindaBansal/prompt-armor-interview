import { createClient } from "@/lib/supabase/server";

import { authRedirect, formValue } from "../utils";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formValue(formData, "password");
  const confirmation = formValue(formData, "password_confirmation");
  if (password.length < 8 || password !== confirmation) {
    return authRedirect(request, "/update-password", "Passwords must match and contain at least 8 characters.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return authRedirect(request, "/update-password", "We could not update your password. Request a new recovery link.");
  return authRedirect(request, "/submissions");
}
