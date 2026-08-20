# Build Status

Append-only. Each finished task gets one line:
`PHASE.TASK — DONE — <one-line note> — <timestamp>`

Gates are checked against this board (see `execution-plan.md §10`).

---

P0.1 — DONE — Next.js (App Router) + TypeScript + Tailwind scaffold, full §2 folder tree committed with `.gitkeep` placeholders, `npm run dev` renders the default shell — 2026-08-20
P0.2 — DONE — Schema + RLS migration (7 tables, 8 enums, append-only audit_log) applied to linked project klhakvliaxqzldzydwia; migration list in sync; all tables have RLS enabled — 2026-08-20
P0.4 — DONE — Shared contracts published: `lib/types.ts` (enums + row/composite types), Supabase helpers (`client`/`server`/`service`/`middleware`/`auth`), root `middleware.ts` session refresh, action stubs (`lib/actions/submissions.ts`), dashboard query signature (`lib/queries/dashboard.ts`). `@supabase/ssr` + `@supabase/supabase-js` added. `tsc --noEmit` clean. Unblocks Agent B's B2 auth work — 2026-08-20
P0.3 — DONE — Seeded 14 rules (5 TILA, 5 UDAAP, 4 FTC_endorsement) scoped by channel+product via migration 20260820080001_seed_rules.sql, applied to linked project; empty scope arrays act as wildcards; selectability verified (13/14 apply to affiliate_landing personal_loan). Phase 0 / Agent A complete — 2026-08-20
A1 — DONE — AI compliance engine (`lib/ai/*` + `app/api/compliance-check/route.ts`): rule selection → strict-JSON prompt → OpenAI (json_object, temp 0) → defensive parse (fences/shape/unknown-verdict→needs_human) → upsert one ai_check per applicable rule via service client. 13/13 parser unit checks pass; live e2e on violating copy persisted 13 checks (9 fails, correct excerpts). `openai`+`ws` added; WebSocket polyfilled for Node 20. `tsc` clean — 2026-08-20
A2 — DONE — Server actions + audit (`lib/actions/submissions.ts` + `lib/actions/audit.ts`): all 7 contract actions implemented + `startReview`; state machine draft→pending_ai→ai_screened→in_review→approved/changes_requested/rejected with resubmission loop; every transition writes audit_log; `submitForReview` runs the A1 check then flips to ai_screened via service client. Fixed an RLS bug (migration 20260820081827) — submitter update policy needed an explicit WITH CHECK to allow draft→pending_ai. 14/14 RLS/state-machine/append-only tests pass with real role clients. `tsc` clean — 2026-08-20
