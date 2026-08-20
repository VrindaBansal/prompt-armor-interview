// POST /api/compliance-check  { submissionId: string }
//
// Runs the AI compliance engine for one submission and persists ai_checks.
// Auth: caller must be signed in AND own the submission (submitter) or be
// reviewer/admin — enforced by reading the submission under the RLS-scoped
// server client before doing any trusted work. The actual writes happen with
// the service-role client inside runComplianceCheck.
//
// A2's submitForReview server action calls this; it's also directly callable.
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { runComplianceCheck } from '@/lib/ai/check';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let submissionId: unknown;
  try {
    ({ submissionId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof submissionId !== 'string' || submissionId.length === 0) {
    return NextResponse.json(
      { error: 'submissionId is required' },
      { status: 400 },
    );
  }

  // Visibility check under RLS: if the caller can't select the row, they may
  // not trigger a check on it. Reviewer/admin see all; submitter sees own.
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from('submissions')
    .select('id')
    .eq('id', submissionId)
    .maybeSingle();
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const summary = await runComplianceCheck(submissionId);
    return NextResponse.json(summary);
  } catch (err) {
    // Defensive: the engine already swallows model/parse errors, so reaching
    // here means a real infrastructure failure (DB, missing key). Log and
    // return 500 without leaking internals.
    console.error('[compliance-check] failed', err);
    return NextResponse.json(
      { error: 'Compliance check failed' },
      { status: 500 },
    );
  }
}
