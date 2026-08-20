-- ClearPath schema and row-level security.
-- 7 tables: profiles, submissions, rules, ai_checks, reviews, comments, audit_log.

-- ── Enums ──────────────────────────────────────────────────────────────────

create type public.role as enum ('submitter', 'reviewer', 'admin');
create type public.channel as enum ('ad', 'email', 'affiliate_landing', 'social');
create type public.product_type as enum ('personal_loan', 'credit_card', 'mortgage_prequal');
create type public.status as enum (
  'draft', 'pending_ai', 'ai_screened',
  'in_review', 'approved', 'changes_requested', 'rejected'
);
create type public.severity as enum ('blocker', 'warning', 'advisory');
create type public.regulation as enum ('TILA', 'UDAAP', 'FTC_endorsement');
create type public.verdict as enum ('pass', 'fail', 'needs_human');
create type public.decision as enum ('approved', 'changes_requested', 'rejected');

-- ── profiles ───────────────────────────────────────────────────────────────
-- One row per auth.users row. Role lives here, not in JWT claims, so RLS
-- policies can join on it directly.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.role not null default 'submitter',
  full_name text,
  created_at timestamptz not null default now()
);

-- New auth users always receive the least-privileged role. Staff roles must be
-- assigned through a trusted administrative process; signup metadata is never
-- an authorization source.
create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── submissions ────────────────────────────────────────────────────────────

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid not null references public.profiles (id),
  title text not null,
  channel public.channel not null,
  product_type public.product_type not null,
  content text not null,
  is_affiliate boolean not null default false,
  status public.status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index submissions_submitter_id_idx on public.submissions (submitter_id);
create index submissions_status_idx on public.submissions (status);

create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger submissions_touch_updated_at
  before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ── rules ──────────────────────────────────────────────────────────────────

create table public.rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  regulation public.regulation not null,
  severity public.severity not null,
  description text not null,
  applies_to_channels public.channel[] not null default '{}',
  applies_to_product_types public.product_type[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ── ai_checks ──────────────────────────────────────────────────────────────
-- One row per (submission, applicable rule), written by the trusted server
-- action using the service-role key.

create table public.ai_checks (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  rule_id uuid not null references public.rules (id),
  verdict public.verdict not null,
  excerpt text,
  explanation text not null,
  suggested_fix text,
  confidence numeric(3, 2) check (confidence >= 0 and confidence <= 1),
  agreed boolean,
  created_at timestamptz not null default now(),
  unique (submission_id, rule_id)
);

create index ai_checks_submission_id_idx on public.ai_checks (submission_id);

-- ── reviews ────────────────────────────────────────────────────────────────
-- One row per reviewer decision. A submission can accumulate several across
-- resubmission loops; avgRevisionLoops (dashboard) counts these per submission.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  decision public.decision not null,
  notes text,
  created_at timestamptz not null default now()
);

create index reviews_submission_id_idx on public.reviews (submission_id);

-- ── comments ───────────────────────────────────────────────────────────────

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  author_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index comments_submission_id_idx on public.comments (submission_id);

-- ── audit_log ──────────────────────────────────────────────────────────────
-- Append-only: no update/delete policy is defined below, and none is granted
-- here, so RLS denies both regardless of role.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  from_status public.status,
  to_status public.status,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_log_submission_id_idx on public.audit_log (submission_id);

revoke update, delete on public.audit_log from authenticated;

-- ── Row-Level Security ───────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.rules enable row level security;
alter table public.ai_checks enable row level security;
alter table public.reviews enable row level security;
alter table public.comments enable row level security;
alter table public.audit_log enable row level security;

-- Helper: current caller's role, without recursively hitting profiles RLS.
create function public.current_role()
returns public.role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- profiles: everyone reads their own row; reviewer/admin read all (needed to
-- show submitter names in the queue and dashboard).
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_select_staff on public.profiles
  for select using (public.current_role() in ('reviewer', 'admin'));

-- submissions: submitters see and create only their own; staff see all.
create policy submissions_select_own on public.submissions
  for select using (submitter_id = auth.uid());

create policy submissions_select_staff on public.submissions
  for select using (public.current_role() in ('reviewer', 'admin'));

create policy submissions_insert_own on public.submissions
  for insert with check (
    submitter_id = auth.uid() and public.current_role() = 'submitter'
  );

-- Submitters edit their own submission only pre-review; staff drive every
-- other transition (pending_ai/ai_screened/in_review/approved/etc).
create policy submissions_update_own_draft on public.submissions
  for update using (
    submitter_id = auth.uid() and status in ('draft', 'changes_requested')
  );

create policy submissions_update_staff on public.submissions
  for update using (public.current_role() in ('reviewer', 'admin'));

-- rules: readable by any authenticated user; writes are admin-only.
create policy rules_select_authenticated on public.rules
  for select using (auth.role() = 'authenticated');

create policy rules_write_admin on public.rules
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ai_checks: no client-side insert policy — only the service role (trusted
-- server route) may write these. Submitters read checks on their own
-- submission; staff read all; staff may update `agreed`.
create policy ai_checks_select_own on public.ai_checks
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

create policy ai_checks_select_staff on public.ai_checks
  for select using (public.current_role() in ('reviewer', 'admin'));

create policy ai_checks_update_staff on public.ai_checks
  for update using (public.current_role() in ('reviewer', 'admin'));

-- reviews: staff write; submitters + staff read on their own/all submissions.
create policy reviews_select_own on public.reviews
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

create policy reviews_select_staff on public.reviews
  for select using (public.current_role() in ('reviewer', 'admin'));

create policy reviews_insert_staff on public.reviews
  for insert with check (
    reviewer_id = auth.uid() and public.current_role() in ('reviewer', 'admin')
  );

-- comments: anyone with visibility into the submission can read/post;
-- author_id must match the caller.
create policy comments_select_own on public.comments
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

create policy comments_select_staff on public.comments
  for select using (public.current_role() in ('reviewer', 'admin'));

create policy comments_insert_own on public.comments
  for insert with check (
    author_id = auth.uid()
    and (
      exists (
        select 1 from public.submissions s
        where s.id = submission_id and s.submitter_id = auth.uid()
      )
      or public.current_role() in ('reviewer', 'admin')
    )
  );

-- audit_log: read scoped like the rest; insert allowed for the acting user
-- only (actor_id must be the caller); update/delete are revoked above and no
-- policy exists for either, so they are denied outright.
create policy audit_log_select_own on public.audit_log
  for select using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.submitter_id = auth.uid()
    )
  );

create policy audit_log_select_staff on public.audit_log
  for select using (public.current_role() in ('reviewer', 'admin'));

create policy audit_log_insert_own on public.audit_log
  for insert with check (actor_id = auth.uid());
