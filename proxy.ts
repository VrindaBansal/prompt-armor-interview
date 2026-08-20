import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Next 16 Proxy (formerly middleware). Proxy defaults to the Node.js runtime,
// which supports @supabase/ssr's transitive deps (supabase-js/realtime) that
// the Edge runtime rejects.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
