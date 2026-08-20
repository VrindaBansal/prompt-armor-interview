// Service-role Supabase client. BYPASSES RLS — server-only.
// Use exclusively for trusted server operations: the seed script and the
// /api/compliance-check route writing ai_checks. NEVER import into a client
// component or expose the key to the browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
