# ClearPath — AI-Augmented Compliance Review

ClearPath turns scattered, email-driven marketing-compliance review into one
structured, auditable pipeline: **submit → AI pre-screen → prioritized reviewer
queue → decision → resubmission loop**, with every state change recorded in an
append-only audit trail.

It targets consumer-credit marketing (personal loans, credit cards, mortgage
prequal) against TILA/Reg Z, UDAAP, and FTC endorsement rules.

---

## The problem and the thesis

A compliance reviewer is the bottleneck. Marketing copy arrives over email in
no fixed shape, every item is read cold with no triage, the same violations
recur, and there is no defensible record of who decided what. Throughput is
capped by one person reading everything.

ClearPath attacks that bottleneck on three levers:

- **L1 — reduce friction per review (the human surface).** Structured intake,
  a queue prioritized by severity and age, and a single review screen that puts
  the copy, its context, and the applicable rules side by side. The reviewer
  stops hunting for information.
- **L2 — reduce the volume that needs deep human attention (the AI lever).**
  An AI pre-screen evaluates each submission against the exact applicable rules
  and flags concrete violations with excerpts and fixes, so the reviewer
  confirms judgments instead of hunting for them, and clean copy is visibly
  clean.
- **C1 — make every decision trustworthy and defensible (compliance).** An
  append-only audit log captures every transition; reviewers can confirm or
  override each AI flag; decisions carry concrete required fixes.

The AI is leverage for the reviewer, not a replacement — a human makes every
final call, and can override the AI on any flag.

---

## What it does (the loop)

1. A **submitter** files structured intake (title, channel, product type,
   content, affiliate flag) and submits for review.
2. The submission enters `pending_ai`; the **AI compliance engine** selects the
   rules that apply to that channel + product, evaluates the copy, and writes
   one flag per rule (pass / fail / needs-human) with an excerpt, explanation,
   suggested fix, and confidence. The item moves to `ai_screened`.
3. A **reviewer** sees it in a queue sorted by severity then age, opens it, and
   reads the copy alongside the AI flags. They **confirm or override** each
   flag and record a decision — approve, request changes, or reject. A
   changes-requested note is pre-seeded with the AI's suggested fixes.
4. On **request changes**, the submitter revises and resubmits; the item is
   re-screened. Loops are counted.
5. An **admin** sees a throughput dashboard: median time in queue, reviews per
   reviewer per day, % AI auto-cleared, average revision loops, and AI
   agreement rate.

Every transition writes an `audit_log` row.

---

## Demo accounts (after seeding)

All demo accounts share the password in `SEED_DEMO_PASSWORD`.

| Role | Email |
|------|-------|
| Admin | `admin@clearpath.demo` |
| Reviewer | `maya.reviewer@clearpath.demo`, `jon.reviewer@clearpath.demo` |
| Submitter | `alex.submitter@clearpath.demo`, `sam.submitter@clearpath.demo`, `taylor.submitter@clearpath.demo` |

The seed creates 15 submissions across every status, mixing clearly-compliant
and clearly-violating copy so the queue and dashboard are populated.
It is idempotent for its reserved `c1ea…` fixture records: rerunning it refreshes
the six demo users and those fixtures without deleting unrelated users or
submissions.

---

## Stack and why

- **Next.js (App Router) + TypeScript** — server components and server actions
  keep data access and the state machine on the server, next to the database,
  behind one type contract shared by every surface.
- **Supabase (Postgres + Auth + Row-Level Security)** — RLS is the security
  boundary, enforced in the database rather than in app code, so role scoping
  holds regardless of which surface calls in. Auth, Postgres, and realtime come
  from one service.
- **OpenAI** from a **server-only route** — the model is never called from the
  browser; the API key never leaves the server.
- **Tailwind** for a restrained, consistent "regulatory dossier" UI.
- **Vercel** for deployment, aligned to the Supabase region.

---

## Architecture

```
app/
  (auth)         login / signup / recovery
  (submitter)    intake + my submissions + submission detail
  (reviewer)     queue + review detail
  (admin)        throughput dashboard
  api/compliance-check   server route: runs the AI engine
components/
  ui             design system (Button, Card, StatusPill, SeverityTag, …)
  review         queue list, flag list, per-flag confirm/override, decision bar
  submission     intake form, submission list, comment thread
lib/
  types.ts       shared contract: enums + row/composite types
  supabase/      client / server / service / middleware / auth helpers
  actions/       server actions (the state machine) + audit helper
  ai/            rule selection, prompt, defensive parse, orchestrator
  queries/       throughput metrics
supabase/migrations/   schema, RLS, seeded ruleset, realtime
seed/            demo users + realistic submissions
```

### Data model

Seven tables: `profiles`, `submissions`, `rules`, `ai_checks`, `reviews`,
`comments`, `audit_log`. Enums mirror the TypeScript contract in `lib/types.ts`
exactly, so the DB and the app cannot drift on status/role/severity values.

### Security model (RLS)

- Submitters see and edit only their own submissions, and only while `draft` or
  `changes_requested`.
- Reviewers and admins see the full queue and drive staff/system transitions.
- `ai_checks` has **no client insert policy** — only the trusted server route
  (service-role key) writes AI results.
- `audit_log` is **append-only by construction**: no update/delete policy
  exists and those privileges are revoked, so history cannot be rewritten by
  any role.

### The AI compliance engine

`lib/ai` runs a strict pipeline: **select applicable rules → build a strict-JSON
prompt → call the model (temperature 0, JSON mode) → defensively parse → persist
one flag per applicable rule** via the service-role client.

The parser is the safety layer: it strips code fences, tolerates either a bare
array or a wrapped object, clamps confidence, drops malformed entries, and maps
any unknown or missing verdict to `needs_human` — never a silent pass.
Unparseable model output degrades to all-`needs_human` rather than crashing the
route, so a bad model response can never break submission.

### State machine

```
draft ──submit──▶ pending_ai ──AI──▶ ai_screened ──open──▶ in_review
                                            │                   │
        changes_requested ◀────── decide ───┴───────────────────┘
                 │                    └──▶ approved / rejected
                 └── resubmit ──▶ pending_ai …
```

Every transition writes an `audit_log` row through a single helper, so no
action bypasses the trail.

---

## Feature map

| # | Feature | Lever |
|---|---------|-------|
| 1 | Role-based auth + guarded segments | L1 / C1 |
| 2 | Structured intake | L1 |
| 3 | Prioritized queue (severity + age) | L1 |
| 4 | Review detail (copy ∥ context ∥ rules) | L1 |
| 5 | Decision actions (approve / changes / reject) | L1 |
| 6 | Threaded, live comments | L1 |
| 7 | Resubmission loop with loop counting | L1 / C1 |
| 8 | AI pre-check (one flag per applicable rule) | L2 |
| 9 | Inline flag display (excerpt + rule + fix) | L2 |
| 10 | Per-flag confirm / override | L2 / C1 |
| 11 | Suggested fixes into the changes note | L2 |
| 12 | Throughput dashboard | proof of impact |
| — | Append-only audit trail | C1 |

---

## Scope decisions

- **Rules are seeded reference data**, not a management UI. A rules-admin
  screen was scoped out as a stretch; the engine reads the seeded ruleset.
- **AI writes advisory flags, never decisions.** The AI never changes a
  submission's status — only a human reviewer decides. This keeps the
  compliance record human-owned.
- **RLS over app-layer authorization.** Role scoping lives in the database so
  it cannot be bypassed by a surface that forgets to check.
- **One flag per applicable rule**, defaulting uncovered rules to
  `needs_human`, so a submission is never left with an applicable rule that has
  no recorded judgment.

---

## Local setup

```bash
npm install
cp env.example .env.local          # fill in real values

# apply schema, RLS, seeded ruleset, realtime
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push

npm run seed                        # demo users + submissions
npm run dev                         # http://localhost:3000
```

Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only), `OPENAI_API_KEY` (server-only),
`NEXT_PUBLIC_SITE_URL`, and `SEED_DEMO_PASSWORD` for the seed. See
`env.example`.

## Repository policy for agents

- The root `README.md` is the only Markdown document permitted in this
  repository.
- Never create, stage, or commit another `.md`, `.mdx`, `.markdown`, `.mdown`,
  or `.mkd` file, including agent instructions, status files, plans, setup
  guides, or nested READMEs.
- Add durable documentation to this README and keep implementation-specific
  explanations beside the relevant code.
- Run `npm run check:markdown` before staging or committing. The same policy
  runs automatically before development, linting, builds, and local commits.
- Keep `agentRules: false` in `next.config.ts`; it prevents Next.js from
  regenerating disallowed agent Markdown files.

## Deploy

Deploy to Vercel from the repo; set the same env vars (secrets included) in the
Vercel project, aligning the region with Supabase. After the first deploy, set
`NEXT_PUBLIC_SITE_URL` to the deployed URL, ensure it is in the Supabase auth
redirect allowlist, and run the seed against the production database.
