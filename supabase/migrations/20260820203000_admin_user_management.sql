-- Allow trusted administrators to deprovision Auth users while retaining the
-- profile rows referenced by the compliance history.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create index if not exists profiles_active_role_idx
  on public.profiles (role)
  where deleted_at is null;

create or replace function public.current_role()
returns public.role
language sql
stable
security definer set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid() and deleted_at is null;
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() and deleted_at is null);

drop policy if exists rules_select_authenticated on public.rules;
create policy rules_select_authenticated on public.rules
  for select using (public.current_role() is not null);

drop policy if exists submissions_select_own on public.submissions;
create policy submissions_select_own on public.submissions
  for select using (
    submitter_id = auth.uid() and public.current_role() = 'submitter'
  );

drop policy if exists ai_checks_select_own on public.ai_checks;
create policy ai_checks_select_own on public.ai_checks
  for select using (
    public.current_role() = 'submitter'
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

drop policy if exists reviews_select_own on public.reviews;
create policy reviews_select_own on public.reviews
  for select using (
    public.current_role() = 'submitter'
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

drop policy if exists comments_select_own on public.comments;
create policy comments_select_own on public.comments
  for select using (
    public.current_role() = 'submitter'
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

drop policy if exists audit_log_select_own on public.audit_log;
create policy audit_log_select_own on public.audit_log
  for select using (
    public.current_role() = 'submitter'
    and exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );
