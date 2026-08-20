-- ClearPath ruleset seed (execution-plan.md §6 P0.3, design §8.2).
-- 14 compliance rules across TILA, UDAAP, and FTC endorsement guidance,
-- scoped by channel and product_type. These are reference data the AI engine
-- (A1) selects from per submission. Idempotent: safe to re-run (on conflict
-- updates the row so edits here propagate on re-push).
--
-- Empty applies_to_channels / applies_to_product_types arrays mean "applies to
-- all" — the A1 selector treats an empty scope array as a wildcard.

insert into public.rules
  (code, regulation, severity, description, applies_to_channels, applies_to_product_types)
values
  -- ── TILA (Truth in Lending Act / Reg Z) ────────────────────────────────
  ('TILA-APR-TRIGGER', 'TILA', 'blocker',
   'If any specific credit term (monthly payment, finance charge, or rate) is stated, the Annual Percentage Rate (APR) must be disclosed with equal prominence.',
   '{}', '{personal_loan,credit_card,mortgage_prequal}'),

  ('TILA-APR-CLARITY', 'TILA', 'blocker',
   'When an APR is advertised, it must be labeled "Annual Percentage Rate" or "APR"; a bare interest rate or "as low as X%" without APR is prohibited.',
   '{}', '{personal_loan,credit_card,mortgage_prequal}'),

  ('TILA-TRIGGER-TERMS', 'TILA', 'warning',
   'Stating a triggering term (down payment amount, payment amount, term length, or finance charge) requires disclosure of the other required terms (down payment, repayment terms, and APR).',
   '{ad,email,affiliate_landing}', '{personal_loan,mortgage_prequal}'),

  ('TILA-NO-RATE-COMMITMENT', 'TILA', 'warning',
   'Rate or payment figures presented as available to the reader must be qualified as representative/estimated unless the reader is actually pre-approved for them.',
   '{}', '{personal_loan,credit_card,mortgage_prequal}'),

  ('TILA-FEES-DISCLOSURE', 'TILA', 'advisory',
   'Advertised fees (origination, annual, late) should be presented completely rather than selectively to avoid understating the cost of credit.',
   '{}', '{personal_loan,credit_card}'),

  -- ── UDAAP (Unfair, Deceptive, or Abusive Acts or Practices) ────────────
  ('UDAAP-GUARANTEE', 'UDAAP', 'blocker',
   'Unconditional approval or guarantee claims ("guaranteed approval", "everyone qualifies", "no credit check") are deceptive when approval is in fact conditional.',
   '{}', '{personal_loan,credit_card,mortgage_prequal}'),

  ('UDAAP-FALSE-URGENCY', 'UDAAP', 'warning',
   'Artificial urgency or scarcity ("act now, offer expires today", "only 3 spots left") that is not genuine may be an abusive practice.',
   '{ad,email,social}', '{}'),

  ('UDAAP-FREE-MISUSE', 'UDAAP', 'warning',
   'Use of "free" or "no cost" is deceptive when fees, conditions, or repayment obligations actually apply.',
   '{}', '{personal_loan,credit_card}'),

  ('UDAAP-SAVINGS-CLAIM', 'UDAAP', 'warning',
   'Savings or "lower your payment" claims must be substantiated and typical, not based on a best-case outlier, or they mislead the reader.',
   '{}', '{personal_loan,mortgage_prequal}'),

  ('UDAAP-FINE-PRINT', 'UDAAP', 'advisory',
   'Material conditions must not be buried in fine print or disclaimers that contradict the headline claim.',
   '{}', '{}'),

  -- ── FTC endorsement / advertising guides ───────────────────────────────
  ('FTC-AFFILIATE-DISCLOSURE', 'FTC_endorsement', 'blocker',
   'Affiliate or paid-partnership content must clearly and conspicuously disclose the material connection (e.g. "advertisement", "paid partnership") near the claim.',
   '{affiliate_landing,social}', '{}'),

  ('FTC-TESTIMONIAL-TYPICAL', 'FTC_endorsement', 'warning',
   'Testimonials or results claims must reflect typical results or clearly disclose that results are not typical.',
   '{ad,affiliate_landing,social}', '{}'),

  ('FTC-ENDORSER-HONESTY', 'FTC_endorsement', 'warning',
   'Endorsements must reflect the honest opinions of a genuine user; fabricated or incentivized reviews presented as organic are prohibited.',
   '{social,affiliate_landing}', '{}'),

  ('FTC-CLEAR-CONSPICUOUS', 'FTC_endorsement', 'advisory',
   'Required disclosures must be clear and conspicuous: unavoidable, in the same medium as the claim, and not relegated to a hover or separate page.',
   '{email,social,affiliate_landing}', '{}')

on conflict (code) do update set
  regulation = excluded.regulation,
  severity = excluded.severity,
  description = excluded.description,
  applies_to_channels = excluded.applies_to_channels,
  applies_to_product_types = excluded.applies_to_product_types;
