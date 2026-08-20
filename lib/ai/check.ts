// Compliance-check orchestrator. Server-only. Uses the service-role client to
// write ai_checks (RLS has no client insert policy on that table by design).
//
// Flow: load submission + rules → select applicable rules → prompt the model →
// defensively parse → persist exactly one ai_check per applicable rule
// (upsert on (submission_id, rule_id)). Rules the model omitted or returned
// garbage for default to a `needs_human` row, so a submission is never left
// with an applicable rule that has no check.
import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import type { Rule, Submission } from '@/lib/types';
import { selectApplicableRules } from './rules';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompt';
import { runComplianceCompletion } from './openai';
import { parseComplianceResponse, type ParsedResult } from './parse';

export interface ComplianceCheckSummary {
  submissionId: string;
  applicableRuleCount: number;
  checksPersisted: number;
  failures: number;
  needsHuman: number;
  modelReturnedResults: number;
}

export async function runComplianceCheck(
  submissionId: string,
): Promise<ComplianceCheckSummary> {
  const supabase = createServiceClient();

  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single<Submission>();
  if (subErr || !submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const { data: allRules, error: rulesErr } = await supabase
    .from('rules')
    .select('*')
    .eq('is_active', true) // deactivated rules (feature 13) never screen
    .returns<Rule[]>();
  if (rulesErr || !allRules) {
    throw new Error('Failed to load rules');
  }

  const applicable = selectApplicableRules(
    allRules,
    submission.channel,
    submission.product_type,
  );

  // No applicable rules → nothing to check. Caller decides the status.
  if (applicable.length === 0) {
    return {
      submissionId,
      applicableRuleCount: 0,
      checksPersisted: 0,
      failures: 0,
      needsHuman: 0,
      modelReturnedResults: 0,
    };
  }

  // Call the model, but never let an API/parse failure crash the caller: on
  // error we fall back to zero parsed results, which becomes all-needs_human.
  let parsed: ParsedResult[] = [];
  try {
    const raw = await runComplianceCompletion(
      SYSTEM_PROMPT,
      buildUserPrompt({
        title: submission.title,
        channel: submission.channel,
        productType: submission.product_type,
        isAffiliate: submission.is_affiliate,
        content: submission.content,
        rules: applicable,
      }),
    );
    parsed = parseComplianceResponse(raw);
  } catch {
    parsed = [];
  }

  const byRuleId = new Map(parsed.map((r) => [r.rule_id, r]));

  // Build one row per applicable rule, defaulting anything the model didn't
  // cover to needs_human.
  const rows = applicable.map((rule) => {
    const r = byRuleId.get(rule.id);
    const excerpt =
      r?.excerpt && submission.content.includes(r.excerpt) ? r.excerpt : null;
    return {
      submission_id: submissionId,
      rule_id: rule.id,
      verdict: r?.verdict ?? ('needs_human' as const),
      excerpt,
      explanation:
        r?.explanation ??
        'The model did not return a result for this rule; flagged for human review.',
      suggested_fix: r?.suggested_fix ?? null,
      confidence: r?.confidence ?? null,
      // A resubmission is new evidence, so prior human agreement must be reset.
      agreed: null,
    };
  });

  const { error: upsertErr, count } = await supabase
    .from('ai_checks')
    .upsert(rows, { onConflict: 'submission_id,rule_id', count: 'exact' });
  if (upsertErr) {
    throw new Error(`Failed to persist ai_checks: ${upsertErr.message}`);
  }

  const failures = rows.filter((r) => r.verdict === 'fail').length;
  const needsHuman = rows.filter((r) => r.verdict === 'needs_human').length;

  return {
    submissionId,
    applicableRuleCount: applicable.length,
    checksPersisted: count ?? rows.length,
    failures,
    needsHuman,
    modelReturnedResults: parsed.length,
  };
}
