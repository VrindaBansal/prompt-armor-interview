-- Enable Supabase Realtime for comments so B4's comment thread streams live
-- across sessions (submitter <-> reviewer). Posting, auditing, and post-refresh
-- already work without this; this only adds the live cross-session stream.
--
-- Idempotent: adding a table already in the publication raises an error, so
-- guard on pg_publication_tables.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end
$$;
