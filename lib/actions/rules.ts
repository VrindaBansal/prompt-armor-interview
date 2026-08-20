'use server';

// Rules management server actions (feature 13, admin-only). Writes go through
// the RLS server client; the rules_write_admin policy enforces admin at the DB
// layer, and these guards fail fast in the app layer too.
//
// Note: rule changes are not written to audit_log — that table is
// submission-scoped by schema. A dedicated rule-change history would be future
// work; out of scope for this stretch feature.
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/supabase/auth';
import type { NewRule, Rule } from '@/lib/types';

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  if (user.profile.role !== 'admin') throw new Error('Forbidden');
  return user;
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '-');
}

export async function listRules(): Promise<Rule[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rules')
    .select('*')
    .order('regulation', { ascending: true })
    .order('code', { ascending: true })
    .returns<Rule[]>();
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createRule(input: NewRule): Promise<Rule> {
  await requireAdmin();
  const code = normalizeCode(input.code);
  if (!code) throw new Error('Rule code is required');
  if (!input.description.trim()) throw new Error('Description is required');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rules')
    .insert({
      code,
      regulation: input.regulation,
      severity: input.severity,
      description: input.description.trim(),
      applies_to_channels: input.applies_to_channels,
      applies_to_product_types: input.applies_to_product_types,
    })
    .select('*')
    .single<Rule>();
  if (error) {
    if (error.code === '23505') throw new Error(`A rule with code ${code} already exists`);
    throw new Error(error.message);
  }
  revalidatePath('/rules');
  return data;
}

export async function updateRule(
  id: string,
  input: NewRule,
): Promise<void> {
  await requireAdmin();
  const code = normalizeCode(input.code);
  if (!code) throw new Error('Rule code is required');
  if (!input.description.trim()) throw new Error('Description is required');

  const supabase = await createClient();
  const { error } = await supabase
    .from('rules')
    .update({
      code,
      regulation: input.regulation,
      severity: input.severity,
      description: input.description.trim(),
      applies_to_channels: input.applies_to_channels,
      applies_to_product_types: input.applies_to_product_types,
    })
    .eq('id', id);
  if (error) {
    if (error.code === '23505') throw new Error(`A rule with code ${code} already exists`);
    throw new Error(error.message);
  }
  revalidatePath('/rules');
}

export async function setRuleActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('rules')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/rules');
}
