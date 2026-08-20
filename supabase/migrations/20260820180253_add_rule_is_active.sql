-- Feature 13: rules management. Add an is_active flag so admins can deactivate
-- a rule (compliance never deletes rules — it retires them) without losing the
-- record. The AI engine only screens against active rules.

alter table public.rules
  add column if not exists is_active boolean not null default true;

create index if not exists rules_is_active_idx on public.rules (is_active);
