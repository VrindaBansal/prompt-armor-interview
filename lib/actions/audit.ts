// Audit trail helper (C1). Every mutating action routes through here so the
// audit_log is never bypassed. from_status/to_status are set only for real
// state transitions; other actions (comment, flag_agreement) leave them null.
//
import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import type { Status } from '@/lib/types';

export interface AuditEntry {
  submission_id: string;
  actor_id: string | null;
  action: string;
  from_status?: Status | null;
  to_status?: Status | null;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('audit_log').insert({
    submission_id: entry.submission_id,
    actor_id: entry.actor_id,
    action: entry.action,
    from_status: entry.from_status ?? null,
    to_status: entry.to_status ?? null,
    metadata: entry.metadata ?? {},
  });
  if (error) {
    // An audit write failing must not be silent — it's the compliance record.
    throw new Error(`audit write failed (${entry.action}): ${error.message}`);
  }
}
