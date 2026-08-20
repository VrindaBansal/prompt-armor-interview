# ClearPath — 5-Minute Demo Script

A tight, narrated walkthrough that follows the arc **chaos → structured intake →
AI pre-flag → fast review → proof of impact**. Timings are guidance; the whole
run fits in ~5 minutes.

---

## Before you start

- **URL:** the deployed app (production).
- **Accounts** (all share `SEED_DEMO_PASSWORD`):
  - Submitter — `alex.submitter@clearpath.demo`
  - Reviewer — `maya.reviewer@clearpath.demo`
  - Admin — `admin@clearpath.demo`
- Have three things ready to move fast: the login page open, the seeded data
  already loaded, and one piece of deliberately non-compliant copy to paste
  (below).
- Optional tip: open reviewer and admin in separate tabs beforehand so switching
  roles is instant.

**Non-compliant copy to paste during intake:**

> GUARANTEED approval for everyone — no credit check needed! Get cash fast at
> just 4.9% with absolutely no fees. Our customers saved an average of $12,000.
> Act now, this exclusive offer expires tonight!

---

## Act 1 — The problem (~30s)

*Say:*
> "Marketing compliance review is bottlenecked on one reviewer. Copy arrives by
> email in no fixed format, every item is read cold, the same violations recur,
> and there's no defensible record of who approved what. Throughput is capped by
> one person reading everything. ClearPath fixes that on three levers: reduce
> friction per review, reduce the volume that needs deep human attention with an
> AI pre-screen, and make every decision auditable."

Land on the login page — the tagline sets the theme: *"Every claim accounted for.
Every decision traceable."*

---

## Act 2 — Structured intake (submitter) (~60s)

1. Sign in as **alex.submitter@clearpath.demo**.
2. *Say:* "First lever — kill the email chaos. Intake is structured, so the AI
   and the human reviewer read from the same source of truth."
3. Click **New submission**. Fill it in:
   - **Title:** `Fall personal loan blast`
   - **Channel:** `Affiliate landing page`
   - **Product:** `Personal loan`
   - **Content:** paste the non-compliant copy above
   - Check **Affiliate content**
4. Click **Submit for AI review**.
5. *Say:* "On submit it goes to AI screening automatically — no one has to
   trigger anything."
6. Back on the submissions list, point at the status pill flipping to
   **AI SCREENED**.

*Key point:* the submitter never emails anyone; the item is now structured,
screened, and in the queue.

---

## Act 3 — AI pre-flag + fast review (reviewer) (~2m)

1. Sign out, sign in as **maya.reviewer@clearpath.demo** (or switch tabs).
2. On the **Review queue**, *say:* "The queue is prioritized — highest severity
   first, oldest next. The reviewer isn't triaging blindly." Point at the summary
   counts (awaiting review / with blockers) and the new item showing
   **BLOCKER · 7 flags · AI SCREENED**.
3. Open the item. *Say:* "One screen: the copy on the left, the AI's compliance
   read on the right — no hunting."
4. Walk two or three flags:
   - **TILA-APR-TRIGGER / APR clarity** — highlight the excerpt "4.9%": *"A rate
     with no APR disclosed — a TILA blocker. The AI cites the exact text and
     suggests the fix."*
   - **UDAAP-GUARANTEE** — "guaranteed approval / no credit check": *"Unconditional
     approval claim — deceptive."*
   - **FTC-AFFILIATE-DISCLOSURE** — *"Affiliate copy with the disclosure in the
     wrong place."*
5. *Say:* "Second lever — the AI is leverage, not the decision-maker. The reviewer
   confirms or overrides each flag." Click **Confirm** on one flag and
   **Override** on another to show the human stays in control.
6. Scroll to the decision. *Say:* "And the note is pre-filled with the AI's
   concrete fixes, so requesting changes sends the submitter something actionable,
   not just 'rejected.'"
7. Click **Request changes**.

*Key point:* the reviewer went from cold copy to an actionable decision in under a
minute, with the AI doing the first pass and the human owning the call.

---

## Act 4 — Trust and the audit trail (C1) (~30s)

*Say:*
> "Third lever — every transition here is written to an append-only audit log:
> who submitted, when the AI screened it, which flags the reviewer confirmed or
> overrode, and the final decision. Nothing can be edited or deleted after the
> fact. That's the defensible record compliance actually needs."

(Optional: mention the resubmission loop — the submitter revises and resubmits,
and it's re-screened; revision loops are counted.)

---

## Act 5 — Proof of impact (admin) (~45s)

1. Sign in as **admin@clearpath.demo** → land on the **Operations dashboard**.
2. Walk the five metrics:
   - **Median time in queue** — how fast items clear.
   - **Reviews / reviewer / day** — reviewer throughput.
   - **AI auto-cleared %** — the share the AI cleared with zero failing flags,
     i.e. the volume the human didn't have to deep-read.
   - **Avg revision loops** — how many changes-requested cycles per item.
   - **AI agreement rate** — how often reviewers confirm the AI, i.e. how much
     trust the pre-screen has earned.
3. *Say:* "This is the whole thesis made measurable: the bottleneck is visibly
   relieved, and we can prove it."

---

## Close (~15s)

*Say:*
> "So: structured intake replaces email chaos, an AI pre-screen handles volume
> and flags concrete violations, the human reviewer stays in control and decides
> fast, every step is audited, and the impact is measurable on the dashboard. One
> defensible pipeline from first draft to final approval."

---

## Fallback / recovery

- **AI screening feels slow:** it's a live model call (a few seconds). Narrate the
  thesis while it runs, or open one of the pre-seeded flagged items in the queue
  instead of submitting live.
- **You get signed into the wrong role:** the top-nav **Sign out** returns you to
  login; each role lands on its own home (submitter → submissions, reviewer →
  queue, admin → dashboard).
- **Nothing in the queue:** confirm the seed has been run against this
  environment (`npm run seed`).
