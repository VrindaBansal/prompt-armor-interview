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
import type {
  Channel,
  NewRule,
  ProductType,
  Regulation,
  Rule,
  Severity,
} from '@/lib/types';

const REGULATIONS = ['TILA', 'UDAAP', 'FTC_endorsement'] as const satisfies readonly Regulation[];
const SEVERITIES = ['blocker', 'warning', 'advisory'] as const satisfies readonly Severity[];
const CHANNELS = ['ad', 'email', 'affiliate_landing', 'social'] as const satisfies readonly Channel[];
const PRODUCTS = ['personal_loan', 'credit_card', 'mortgage_prequal'] as const satisfies readonly ProductType[];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RULE_CODE = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new Error('Not authenticated');
  if (user.profile.role !== 'admin') throw new Error('Forbidden');
  return user;
}

function requireId(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error('Invalid rule identifier');
  }
}

function isAllowed<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function parseScope<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T[] {
  if (!Array.isArray(value) || !value.every((item) => isAllowed(item, allowed))) {
    throw new Error(`Invalid ${label}`);
  }
  return [...new Set(value as T[])];
}

function parseRuleInput(input: unknown): NewRule {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid rule');
  }

  const value = input as Record<string, unknown>;
  if (typeof value.code !== 'string' || typeof value.description !== 'string') {
    throw new Error('Invalid rule');
  }

  const code = value.code.trim().toUpperCase().replace(/[\s_]+/g, '-');
  const description = value.description.trim();
  if (code.length === 0 || code.length > 80 || !RULE_CODE.test(code)) {
    throw new Error('Rule code must be 1–80 letters, numbers, or hyphen-separated segments');
  }
  if (description.length === 0 || description.length > 2_000) {
    throw new Error('Requirement must be 1–2,000 characters');
  }
  if (!isAllowed(value.regulation, REGULATIONS) || !isAllowed(value.severity, SEVERITIES)) {
    throw new Error('Invalid rule classification');
  }

  return {
    code,
    regulation: value.regulation,
    severity: value.severity,
    description,
    applies_to_channels: parseScope(value.applies_to_channels, CHANNELS, 'channel scope'),
    applies_to_product_types: parseScope(value.applies_to_product_types, PRODUCTS, 'product scope'),
  };
}

function databaseError(operation: string, error: { code?: string; message: string }): never {
  console.error('Rule database operation failed', { operation, errorCode: error.code });
  throw new Error(`Unable to ${operation} rule`);
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
  if (error) databaseError('list', error);
  return data ?? [];
}

export async function createRule(input: NewRule): Promise<Rule> {
  await requireAdmin();
  const rule = parseRuleInput(input);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rules')
    .insert(rule)
    .select('*')
    .single<Rule>();
  if (error) {
    if (error.code === '23505') throw new Error(`A rule with code ${rule.code} already exists`);
    databaseError('create', error);
  }
  revalidatePath('/rules');
  return data;
}

export async function updateRule(
  id: string,
  input: NewRule,
): Promise<void> {
  requireId(id);
  await requireAdmin();
  const rule = parseRuleInput(input);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rules')
    .update(rule)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw new Error(`A rule with code ${rule.code} already exists`);
    databaseError('update', error);
  }
  if (!data) throw new Error('Rule not found');
  revalidatePath('/rules');
}

export async function setRuleActive(id: string, isActive: boolean): Promise<void> {
  requireId(id);
  if (typeof isActive !== 'boolean') throw new Error('Invalid active state');
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rules')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) databaseError('change', error);
  if (!data) throw new Error('Rule not found');
  revalidatePath('/rules');
}
