// Service-role Supabase client. BYPASSES RLS — server-only.
// Use exclusively for trusted server operations: the seed script and the
// /api/compliance-check route writing ai_checks. NEVER import into a client
// component or expose the key to the browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// supabase-js v2 constructs its realtime client eagerly and needs a global
// WebSocket. Node 22+ (and Vercel's runtime) provide one natively; Node 20
// local dev does not, so polyfill it when missing. We never open a realtime
// channel from the server, but the constructor still requires the global.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  (globalThis as { WebSocket?: unknown }).WebSocket = require('ws');
}

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
