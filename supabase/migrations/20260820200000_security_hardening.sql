-- Lock trusted mutations behind server actions and repair least-privilege
-- signup behavior for databases that already applied the initial schema.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'submitter',
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

-- Browser sessions retain read access through RLS. All writes below now go
-- through explicitly authorized server actions using the service role.
drop policy if exists submissions_insert_own on public.submissions;
drop policy if exists submissions_update_own_draft on public.submissions;
drop policy if exists submissions_update_staff on public.submissions;
drop policy if exists ai_checks_update_staff on public.ai_checks;
drop policy if exists reviews_insert_staff on public.reviews;
drop policy if exists comments_insert_own on public.comments;
drop policy if exists audit_log_insert_own on public.audit_log;

revoke insert, update, delete on public.profiles from anon, authenticated;
revoke insert, update, delete on public.submissions from anon, authenticated;
revoke insert, update, delete on public.ai_checks from anon, authenticated;
revoke insert, update, delete on public.reviews from anon, authenticated;
revoke insert, update, delete on public.comments from anon, authenticated;
revoke insert, update, delete on public.audit_log from anon, authenticated;

-- Make security-definer access explicit. current_role exposes only the
-- caller's own role and is required by the read policies.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.current_role() from public, anon, authenticated;
grant execute on function public.current_role() to authenticated;

-- NOT VALID avoids breaking deployment on unknown legacy rows while still
-- enforcing these limits for every new or updated row.
alter table public.profiles
  add constraint profiles_full_name_length
  check (full_name is null or char_length(btrim(full_name)) between 1 and 120)
  not valid;

alter table public.submissions
  add constraint submissions_title_length
  check (char_length(btrim(title)) between 1 and 120)
  not valid;

alter table public.submissions
  add constraint submissions_content_length
  check (char_length(btrim(content)) between 20 and 12000)
  not valid;

alter table public.comments
  add constraint comments_body_length
  check (char_length(btrim(body)) between 1 and 2000)
  not valid;

alter table public.reviews
  add constraint reviews_notes_length
  check (notes is null or char_length(notes) <= 4000)
  not valid;

alter table public.ai_checks
  add constraint ai_checks_text_length
  check (
    char_length(explanation) <= 2000
    and (excerpt is null or char_length(excerpt) <= 2000)
    and (suggested_fix is null or char_length(suggested_fix) <= 2000)
  )
  not valid;

alter table public.audit_log
  add constraint audit_log_action_length
  check (char_length(btrim(action)) between 1 and 100)
  not valid;
