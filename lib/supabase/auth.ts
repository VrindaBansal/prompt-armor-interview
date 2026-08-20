// Server-side session + role resolution. This is the profiles-table contract
// Agent B uses to route a signed-in user to their role home and to guard the
// (reviewer)/(admin)/(submitter) segments.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Role } from '@/lib/types';

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
}

// Returns the signed-in user with their profile, or null if not signed in.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { id: user.id, email: user.email ?? null, profile: profile as Profile };
}

// Guard for a server component / layout: require a signed-in user, optionally
// of one of the allowed roles. Redirects to /login (unauthenticated) or the
// user's own role home (wrong role) instead of throwing.
export async function requireUser(allowed?: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (allowed && !allowed.includes(user.profile.role)) {
    redirect(roleHome(user.profile.role));
  }
  return user;
}

// The landing path for each role. Auth pages call this after login.
export function roleHome(role: Role): string {
  switch (role) {
    case 'reviewer':
      return '/queue';
    case 'admin':
      return '/dashboard';
    case 'submitter':
      return '/submissions';
  }
}
