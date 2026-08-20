-- Fix: submitters could not transition draft -> pending_ai.
--
-- The original submissions_update_own_draft policy had only a USING clause.
-- For UPDATE, Postgres reuses USING as the WITH CHECK when the latter is
-- omitted, so the NEW row also had to satisfy status in
-- ('draft','changes_requested'). That made submitForReview (which sets
-- pending_ai) impossible for the row owner.
--
-- Split the concerns explicitly:
--   USING      → which rows a submitter may update FROM (draft/changes_requested)
--   WITH CHECK → which states they may write TO (edit in place, or submit to
--                pending_ai). They still cannot reach ai_screened/in_review/
--                approved/rejected — those are staff/system transitions.

drop policy if exists submissions_update_own_draft on public.submissions;

create policy submissions_update_own_draft on public.submissions
  for update
  using (
    submitter_id = auth.uid()
    and status in ('draft', 'changes_requested')
  )
  with check (
    submitter_id = auth.uid()
    and status in ('draft', 'changes_requested', 'pending_ai')
  );
