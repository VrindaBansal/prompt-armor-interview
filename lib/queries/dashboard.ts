// Dashboard query CONTRACT (execution-plan.md §4.3). Signature is frozen so
// Agent B can build the dashboard UI (B6) against it with a mock provider now.
// Agent A implements the real query in A5.
import type { ThroughputMetrics } from '@/lib/types';

export async function getThroughputMetrics(): Promise<ThroughputMetrics> {
  throw new Error('getThroughputMetrics not implemented yet (A5)');
}
