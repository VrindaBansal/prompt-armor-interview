import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.SEED_DEMO_PASSWORD;
const seedConfirmation = process.env.SEED_DEMO_CONFIRM;

if (!url || !serviceKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
if (!demoPassword || demoPassword.length < 12) throw new Error("SEED_DEMO_PASSWORD must contain at least 12 characters.");
if (seedConfirmation !== "seed-clearpath-demo") {
  throw new Error("Set SEED_DEMO_CONFIRM=seed-clearpath-demo before creating demo accounts.");
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const people = [
  { key: "admin", email: "admin@clearpath.demo", fullName: "Avery Chen", role: "admin" },
  { key: "reviewer1", email: "maya.reviewer@clearpath.demo", fullName: "Maya Patel", role: "reviewer" },
  { key: "reviewer2", email: "jon.reviewer@clearpath.demo", fullName: "Jon Bell", role: "reviewer" },
  { key: "submitter1", email: "alex.submitter@clearpath.demo", fullName: "Alex Morgan", role: "submitter" },
  { key: "submitter2", email: "sam.submitter@clearpath.demo", fullName: "Sam Rivera", role: "submitter" },
  { key: "submitter3", email: "taylor.submitter@clearpath.demo", fullName: "Taylor Kim", role: "submitter" },
];

const submissionFixtures = [
  ["01", "submitter1", "Q4 personal loan nurture", "email", "personal_loan", false, "draft", "Explore flexible personal loan options with repayment terms tailored to your application. Review the APR and full terms before accepting an offer."],
  ["02", "submitter1", "Everyday rewards card launch", "ad", "credit_card", false, "ai_screened", "Get our rewards card at rates as low as 9.9%. Apply today and start earning on every purchase."],
  ["03", "submitter1", "Homebuyer confidence social", "social", "mortgage_prequal", false, "in_review", "Your dream home is guaranteed. Everyone qualifies for our instant mortgage prequalification."],
  ["04", "submitter1", "Partner card comparison", "affiliate_landing", "credit_card", true, "approved", "Advertisement: We may receive compensation. Compare card APRs, annual fees, and eligibility terms before applying."],
  ["05", "submitter1", "Fast funds affiliate page", "affiliate_landing", "personal_loan", true, "changes_requested", "I found the easiest personal loan online. Approval is guaranteed and this lender paid us to feature the offer."],
  ["06", "submitter2", "Last-chance card promotion", "social", "credit_card", false, "ai_screened", "Only three approvals remain. Act today before this no-cost credit card disappears forever."],
  ["07", "submitter2", "Mortgage education series", "email", "mortgage_prequal", false, "approved", "Mortgage prequalification is an estimate, not a commitment to lend. Rates, payments, and eligibility vary by applicant."],
  ["08", "submitter2", "Zero-cost loan banner", "ad", "personal_loan", false, "rejected", "Free money with no credit check. Everyone is approved instantly and there are absolutely no costs."],
  ["09", "submitter2", "First-time buyer guide", "affiliate_landing", "mortgage_prequal", true, "draft", "Paid partnership: Learn what lenders review during mortgage prequalification and which documents can help you prepare."],
  ["10", "submitter2", "Customer payoff story", "affiliate_landing", "personal_loan", true, "ai_screened", "Sponsored: Jordan erased debt in one week with this loan. You can expect the same life-changing result."],
  ["11", "submitter3", "Balance transfer email", "email", "credit_card", false, "in_review", "Pay 0% interest for 18 months. Fees and the APR after the introductory period are available in separate terms."],
  ["12", "submitter3", "Responsible borrowing tips", "social", "personal_loan", false, "approved", "A personal loan may simplify payments, but total cost depends on APR, fees, term, and your approved offer."],
  ["13", "submitter3", "Lower-payment mortgage ad", "ad", "mortgage_prequal", false, "changes_requested", "Cut your mortgage payment in half with our guaranteed 3% rate and $900 monthly payment."],
  ["14", "submitter3", "Organic card review", "social", "credit_card", true, "rejected", "Five stars! I am a regular customer and definitely was not paid to say this is the best card for everyone."],
  ["15", "submitter3", "Home loan partner roundup", "affiliate_landing", "mortgage_prequal", true, "ai_screened", "These mortgage partners guarantee the lowest payment. Click any offer to qualify immediately."],
];

const issueBySubmission = {
  "02": ["TILA-APR-CLARITY", "9.9%", "The rate is not clearly identified as APR.", "Label the figure as APR and disclose applicable terms."],
  "03": ["UDAAP-GUARANTEE", "guaranteed", "Approval is presented as unconditional.", "Explain that prequalification depends on application review."],
  "05": ["FTC-AFFILIATE-DISCLOSURE", "paid us", "The material connection appears after the endorsement.", "Place a clear paid-partnership disclosure before the claim."],
  "06": ["UDAAP-FALSE-URGENCY", "Only three approvals remain", "The scarcity claim requires substantiation.", "Remove the countdown unless the limit is genuine and documented."],
  "08": ["UDAAP-FREE-MISUSE", "Free money", "A repayable loan is described as free.", "Describe the APR, fees, and repayment obligation."],
  "10": ["FTC-TESTIMONIAL-TYPICAL", "expect the same", "An exceptional testimonial is presented as typical.", "State typical outcomes and that individual results vary."],
  "11": ["UDAAP-FINE-PRINT", "separate terms", "Material pricing is separated from the headline claim.", "Show the transfer fee and post-introductory APR with the offer."],
  "13": ["TILA-TRIGGER-TERMS", "$900 monthly payment", "A payment amount triggers additional credit disclosures.", "Add repayment terms, down payment assumptions, and APR."],
  "14": ["FTC-ENDORSER-HONESTY", "not paid", "The purported organic endorsement conflicts with the affiliate relationship.", "Disclose compensation and use an authentic endorser statement."],
  "15": ["FTC-AFFILIATE-DISCLOSURE", "mortgage partners", "The affiliate relationship is not disclosed near the recommendation.", "Add a clear paid-partnership disclosure before partner links."],
};

const daysAgo = (days, hour = 15) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

async function requireData(promise, label) {
  const { data, error } = await promise;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data;
}

async function ensureUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const existing = new Map(data.users.map((user) => [user.email, user]));
  const ids = {};

  for (const person of people) {
    let user = existing.get(person.email);
    const attributes = { password: demoPassword, email_confirm: true, user_metadata: { full_name: person.fullName } };
    if (user) {
      const result = await supabase.auth.admin.updateUserById(user.id, attributes);
      if (result.error) throw result.error;
      user = result.data.user;
    } else {
      const result = await supabase.auth.admin.createUser({ email: person.email, ...attributes });
      if (result.error) throw result.error;
      user = result.data.user;
    }
    ids[person.key] = user.id;
    await requireData(supabase.from("profiles").upsert({ id: user.id, role: person.role, full_name: person.fullName }, { onConflict: "id" }), `profile ${person.email}`);
  }
  return ids;
}

const userIds = await ensureUsers();
const seededIds = submissionFixtures.map(([suffix]) => `c1ea0000-0000-4000-8000-0000000000${suffix}`);
await requireData(supabase.from("submissions").delete().in("id", seededIds), "clear prior demo submissions");

const submissions = submissionFixtures.map(([suffix, owner, title, channel, productType, affiliate, status, content], index) => ({
  id: `c1ea0000-0000-4000-8000-0000000000${suffix}`,
  submitter_id: userIds[owner], title, channel, product_type: productType, content,
  is_affiliate: affiliate, status, created_at: daysAgo(18 - index), updated_at: daysAgo(Math.max(0, 12 - index), 18),
}));
await requireData(supabase.from("submissions").insert(submissions), "insert demo submissions");

const rules = await requireData(supabase.from("rules").select("id, code"), "load rules");
const ruleIds = new Map(rules.map((rule) => [rule.code, rule.id]));
// Reviewer confirm/override on flags of reviewed submissions (true = confirmed
// the AI flag, false = overrode). Yields a realistic AI-agreement rate on the
// dashboard instead of 0%. Unreviewed items stay null (not yet acted on).
const flagAgreementBySuffix = { "05": true, "08": true, "13": true, "14": false };
const aiChecks = [];
for (const submission of submissions) {
  if (submission.status === "draft") continue;
  const suffix = submission.id.slice(-2);
  const issue = issueBySubmission[suffix];
  if (issue) {
    const [code, excerpt, explanation, suggestedFix] = issue;
    aiChecks.push({ submission_id: submission.id, rule_id: ruleIds.get(code), verdict: "fail", excerpt, explanation, suggested_fix: suggestedFix, confidence: 0.94, agreed: flagAgreementBySuffix[suffix] ?? null, created_at: submission.updated_at });
  }
  const passCode = issue?.[0] === "UDAAP-FINE-PRINT" ? "TILA-NO-RATE-COMMITMENT" : "UDAAP-FINE-PRINT";
  aiChecks.push({ submission_id: submission.id, rule_id: ruleIds.get(passCode), verdict: "pass", excerpt: null, explanation: "No conflicting or obscured material condition was identified in this fixture.", suggested_fix: null, confidence: 0.91, agreed: null, created_at: submission.updated_at });
}
if (aiChecks.some((check) => !check.rule_id)) throw new Error("Seed fixture references an unknown compliance rule.");
await requireData(supabase.from("ai_checks").insert(aiChecks), "insert AI checks");

const bySuffix = new Map(submissions.map((submission) => [submission.id.slice(-2), submission]));
const reviewSpecs = [["04", "reviewer1", "approved", "Affiliate disclosure and pricing context are clear."], ["05", "reviewer2", "changes_requested", "Move the paid relationship disclosure before the endorsement."], ["07", "reviewer1", "approved", "Educational framing accurately qualifies prequalification."], ["08", "reviewer2", "rejected", "Guarantee and free-money claims cannot be substantiated."], ["12", "reviewer1", "approved", "Balanced cost language is suitable for publication."], ["13", "reviewer2", "changes_requested", "Add all disclosures triggered by the payment claim."], ["14", "reviewer1", "rejected", "The endorsement misrepresents the affiliate relationship."]];
const reviews = reviewSpecs.map(([suffix, reviewer, decision, notes], index) => ({ submission_id: bySuffix.get(suffix).id, reviewer_id: userIds[reviewer], decision, notes, created_at: daysAgo(8 - index, 19) }));
await requireData(supabase.from("reviews").insert(reviews), "insert reviews");

const commentSpecs = [["05", "reviewer2", "Please put the sponsorship disclosure above the first claim."], ["05", "submitter1", "Understood. I’ll revise the opening and resubmit."], ["11", "reviewer1", "Can you confirm the balance-transfer fee and ongoing APR?"], ["11", "submitter3", "I’m checking the approved pricing sheet now."], ["13", "reviewer2", "The $900 payment needs assumptions and repayment terms."], ["13", "submitter3", "I’ll add the down-payment assumption and representative APR."], ["03", "reviewer1", "Please provide support for the universal approval statement."], ["03", "submitter1", "There is no support; I’ll replace it with conditional language."]];
const comments = commentSpecs.map(([suffix, author, body], index) => ({ submission_id: bySuffix.get(suffix).id, author_id: userIds[author], body, created_at: daysAgo(6 - Math.floor(index / 2), 14 + index % 2) }));
await requireData(supabase.from("comments").insert(comments), "insert comments");

const auditRows = [];
for (const submission of submissions) {
  auditRows.push({ submission_id: submission.id, actor_id: submission.submitter_id, action: "create", from_status: null, to_status: "draft", metadata: { source: "demo_seed" }, created_at: submission.created_at });
  if (submission.status !== "draft") {
    auditRows.push({ submission_id: submission.id, actor_id: submission.submitter_id, action: "submit_for_review", from_status: "draft", to_status: "pending_ai", metadata: { source: "demo_seed" }, created_at: submission.updated_at });
    auditRows.push({ submission_id: submission.id, actor_id: null, action: "ai_screened", from_status: "pending_ai", to_status: "ai_screened", metadata: { source: "demo_seed" }, created_at: submission.updated_at });
  }
}
for (const review of reviews) auditRows.push({ submission_id: review.submission_id, actor_id: review.reviewer_id, action: "decide", from_status: "in_review", to_status: review.decision, metadata: { source: "demo_seed" }, created_at: review.created_at });
for (const comment of comments) auditRows.push({ submission_id: comment.submission_id, actor_id: comment.author_id, action: "comment", from_status: null, to_status: null, metadata: { source: "demo_seed" }, created_at: comment.created_at });
await requireData(supabase.from("audit_log").insert(auditRows), "insert audit history");

const persistedSubmissions = await requireData(supabase.from("submissions").select("id, status").in("id", seededIds), "verify submissions");
const persistedChecks = await requireData(supabase.from("ai_checks").select("submission_id, verdict").in("submission_id", seededIds), "verify AI checks");
const persistedComments = await requireData(supabase.from("comments").select("id").in("submission_id", seededIds), "verify comments");
if (persistedSubmissions.length !== submissions.length || persistedChecks.length !== aiChecks.length || persistedComments.length !== comments.length) {
  throw new Error("Seed verification failed: persisted fixture counts do not match the requested dataset.");
}
const queueIds = new Set(persistedSubmissions.filter((item) => item.status === "ai_screened" || item.status === "in_review").map((item) => item.id));
const flaggedQueueItems = new Set(persistedChecks.filter((check) => check.verdict === "fail" && queueIds.has(check.submission_id)).map((check) => check.submission_id));
if (queueIds.size < 4 || flaggedQueueItems.size < 4) throw new Error("Seed verification failed: reviewer queue lacks varied flagged items.");

const statusSummary = Object.entries(persistedSubmissions.reduce((counts, item) => ({ ...counts, [item.status]: (counts[item.status] ?? 0) + 1 }), {})).map(([status, count]) => `${status}=${count}`).join(", ");
console.log(`Seed complete: ${people.length} users, ${submissions.length} submissions, ${aiChecks.length} AI checks, ${reviews.length} reviews, ${comments.length} comments.`);
console.log(`Status mix: ${statusSummary}; flagged queue items=${flaggedQueueItems.size}.`);
console.log("Demo account emails are documented in seed/README.md; all use SEED_DEMO_PASSWORD.");
