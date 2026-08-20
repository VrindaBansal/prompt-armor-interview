'use server';

import { revalidatePath } from 'next/cache';
import { getSessionUser } from '@/lib/supabase/auth';
import { createServiceClient } from '@/lib/supabase/service';
import type { ManagedUser, ManagedUserInput, Profile, Role } from '@/lib/types';

const ROLES = new Set<Role>(['submitter', 'reviewer', 'admin']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ActiveProfile = Pick<Profile, 'id' | 'role' | 'full_name' | 'created_at' | 'deleted_at'>;

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  if (user.profile.role !== 'admin') throw new Error('Forbidden');
  return user;
}

function requireId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error('Invalid user identifier');
  }
}

function parseInput(input: unknown, passwordRequired: boolean): Required<ManagedUserInput> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid user');
  }

  const value = input as Record<string, unknown>;
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : '';
  const fullName = typeof value.full_name === 'string' ? value.full_name.trim() : '';
  const password = typeof value.password === 'string' ? value.password : '';
  if (!EMAIL.test(email) || email.length > 320) throw new Error('Enter a valid email address');
  if (fullName.length === 0 || fullName.length > 120) {
    throw new Error('Full name must be 1–120 characters');
  }
  if (!ROLES.has(value.role as Role)) throw new Error('Invalid role');
  if (passwordRequired && (password.length < 12 || password.length > 1024)) {
    throw new Error('Temporary password must be 12–1,024 characters');
  }

  return { email, full_name: fullName, role: value.role as Role, password };
}

async function requireAnotherAdminIfNeeded(target: ActiveProfile, nextRole?: Role) {
  if (target.role !== 'admin' || nextRole === 'admin') return;
  const service = createServiceClient();
  const { count, error } = await service
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'admin')
    .is('deleted_at', null);
  if (error) throw new Error('Unable to verify administrator coverage');
  if ((count ?? 0) <= 1) throw new Error('Assign another administrator first');
}

export async function listUsers(): Promise<ManagedUser[]> {
  await requireAdmin();
  const service = createServiceClient();
  const [{ data: profiles, error: profileError }, { data: authData, error: authError }] = await Promise.all([
    service
      .from('profiles')
      .select('id, role, full_name, created_at, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .returns<ActiveProfile[]>(),
    service.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (profileError || authError) throw new Error('Unable to load users');

  const authById = new Map(authData.users.map((user) => [user.id, user]));
  return (profiles ?? []).flatMap((profile) => {
    const authUser = authById.get(profile.id);
    if (!authUser?.email) return [];
    return [{
      id: profile.id,
      email: authUser.email,
      full_name: profile.full_name ?? '',
      role: profile.role,
      created_at: profile.created_at,
      email_confirmed: Boolean(authUser.email_confirmed_at),
      last_sign_in_at: authUser.last_sign_in_at ?? null,
    }];
  });
}

export async function createUser(input: ManagedUserInput): Promise<void> {
  await requireAdmin();
  const value = parseInput(input, true);
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.createUser({
    email: value.email,
    password: value.password,
    email_confirm: true,
    user_metadata: { full_name: value.full_name },
  });
  if (error || !data.user) throw new Error('Unable to create user; the email may already exist');

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .update({ full_name: value.full_name, role: value.role })
    .eq('id', data.user.id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (profileError || !profile) {
    await service.auth.admin.deleteUser(data.user.id);
    throw new Error('Unable to create the user profile');
  }
  revalidatePath('/users');
}

export async function updateUser(id: string, input: ManagedUserInput): Promise<void> {
  requireId(id);
  const actor = await requireAdmin();
  const value = parseInput(input, false);
  if (id === actor.id && value.role !== 'admin') throw new Error('You cannot remove your own administrator role');

  const service = createServiceClient();
  const { data: target, error: targetError } = await service
    .from('profiles')
    .select('id, role, full_name, created_at, deleted_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle<ActiveProfile>();
  if (targetError || !target) throw new Error('User not found');
  await requireAnotherAdminIfNeeded(target, value.role);

  const { data: authData, error: getAuthError } = await service.auth.admin.getUserById(id);
  if (getAuthError || !authData.user) throw new Error('Auth user not found');
  const previousMetadata = authData.user.user_metadata;
  const previousEmail = authData.user.email;
  const { error: authError } = await service.auth.admin.updateUserById(id, {
    email: value.email,
    email_confirm: true,
    user_metadata: { ...previousMetadata, full_name: value.full_name },
  });
  if (authError) throw new Error('Unable to update the Auth user');

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .update({ full_name: value.full_name, role: value.role })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (profileError || !profile) {
    await service.auth.admin.updateUserById(id, {
      ...(previousEmail ? { email: previousEmail, email_confirm: true } : {}),
      user_metadata: previousMetadata,
    });
    throw new Error('Unable to update the user profile');
  }
  revalidatePath('/users');
}

export async function deleteUser(id: string): Promise<void> {
  requireId(id);
  const actor = await requireAdmin();
  if (id === actor.id) throw new Error('You cannot delete your own account');

  const service = createServiceClient();
  const { data: target, error: targetError } = await service
    .from('profiles')
    .select('id, role, full_name, created_at, deleted_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle<ActiveProfile>();
  if (targetError || !target) throw new Error('User not found');
  await requireAnotherAdminIfNeeded(target, 'submitter');

  const deletedAt = new Date().toISOString();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .update({ deleted_at: deletedAt, full_name: 'Deleted user', role: 'submitter' })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .maybeSingle();
  if (profileError || !profile) throw new Error('Unable to deprovision the user profile');

  const { error: authError } = await service.auth.admin.deleteUser(id, true);
  if (authError) {
    await service
      .from('profiles')
      .update({ deleted_at: null, full_name: target.full_name, role: target.role })
      .eq('id', id);
    throw new Error('Unable to delete the Auth user');
  }
  revalidatePath('/users');
}
