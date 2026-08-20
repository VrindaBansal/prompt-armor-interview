import { NextResponse } from "next/server";

import type { Role } from "@/lib/types";
import { roleHome } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

import { authRedirect, formValue, rejectCrossOrigin } from "../utils";

// One-click demo sign-in. Enabled only when NEXT_PUBLIC_DEMO_MODE === "true"
// (a throwaway demo deployment). Signs in the seeded account for the requested
// role using the server-side SEED_DEMO_PASSWORD — the password never reaches
// the browser. Never enable on a real deployment.
const DEMO_EMAILS: Record<Role, string> = {
  submitter: "alex.submitter@clearpath.demo",
  reviewer: "maya.reviewer@clearpath.demo",
  admin: "admin@clearpath.demo",
};

function isRole(value: string): value is Role {
  return value === "submitter" || value === "reviewer" || value === "admin";
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return new NextResponse("Not found", { status: 404 });
  }
  const rejected = rejectCrossOrigin(request);
  if (rejected) return rejected;

  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) {
    return authRedirect(request, "/login", "Demo mode is misconfigured (no demo password).");
  }

  const formData = await request.formData();
  const role = formValue(formData, "role");
  if (!isRole(role)) {
    return authRedirect(request, "/login", "Unknown demo role.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAILS[role],
    password,
  });
  if (error || !data.user) {
    return authRedirect(request, "/login", "Demo account not seeded yet. Run the seed first.");
  }

  return authRedirect(request, roleHome(role));
}
