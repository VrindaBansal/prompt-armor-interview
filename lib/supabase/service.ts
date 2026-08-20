// Service-role Supabase client. BYPASSES RLS — server-only.
// Use exclusively after explicit authorization in trusted server operations.
// NEVER import into a client component or expose the key to the browser.
import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server credentials are not configured');
  }

  return createSupabaseClient(
    url,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
