// Defensive parsing of the model's response. The route must never crash on
// malformed output, so every step degrades gracefully:
//   - strip markdown code fences the model may add despite instructions
//   - tolerate a bare array or a { results: [...] } wrapper
//   - coerce/validate each result; drop entries that can't be salvaged
//   - map an unknown rule_id to nothing (we only persist known rules)
import type { Verdict } from '@/lib/types';

export interface ParsedResult {
  rule_id: string;
  verdict: Verdict;
  excerpt: string | null;
  explanation: string;
  suggested_fix: string | null;
  confidence: number | null;
}

const VERDICTS: Verdict[] = ['pass', 'fail', 'needs_human'];

// Remove ```json ... ``` or ``` ... ``` fences and surrounding whitespace.
export function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return (fence ? fence[1] : trimmed).trim();
}

function toStringOrNull(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length > 0 && t.toLowerCase() !== 'null' ? t : null;
  }
  return null;
}

function toConfidence(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(1, Math.max(0, n));
}

function coerceResult(entry: unknown): ParsedResult | null {
  if (!entry || typeof entry !== 'object') return null;
  const e = entry as Record<string, unknown>;

  const rule_id = typeof e.rule_id === 'string' ? e.rule_id.trim() : '';
  if (!rule_id) return null;

  const verdictRaw = typeof e.verdict === 'string' ? e.verdict.trim().toLowerCase() : '';
  const verdict = (VERDICTS as string[]).includes(verdictRaw)
    ? (verdictRaw as Verdict)
    : 'needs_human'; // unknown verdict → route to a human, never silently pass

  const explanation =
    toStringOrNull(e.explanation) ?? 'No explanation returned by the model.';

  return {
    rule_id,
    verdict,
    excerpt: toStringOrNull(e.excerpt),
    explanation,
    suggested_fix: toStringOrNull(e.suggested_fix),
    confidence: toConfidence(e.confidence),
  };
}

// Parse the raw model text into validated results. Returns [] on unrecoverable
// output rather than throwing.
export function parseComplianceResponse(raw: string): ParsedResult[] {
  let data: unknown;
  try {
    data = JSON.parse(stripCodeFences(raw));
  } catch {
    return [];
  }

  const list: unknown = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? (data as Record<string, unknown>).results
      : undefined;

  if (!Array.isArray(list)) return [];

  const out: ParsedResult[] = [];
  const seen = new Set<string>();
  for (const entry of list) {
    const r = coerceResult(entry);
    if (r && !seen.has(r.rule_id)) {
      seen.add(r.rule_id); // one result per rule; ignore duplicates
      out.push(r);
    }
  }
  return out;
}
