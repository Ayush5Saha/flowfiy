/**
 * Credit economics — the single source of truth for pricing math.
 *
 * 1 credit = ₹10. Charging is COST-PLUS: we take a run's true COGS, mark it up to
 * hold a 60% NET margin, and convert to credits. See
 * docs/nl-lead-pipeline-implementation-plan.md §J.
 *
 * Apify actor rates below are the STARTER-tier numbers for
 * compass/crawler-google-places (the plan currently in use). Bump these when the
 * Apify subscription tier changes — leads-per-credit improves automatically.
 */

export const FX_INR_PER_USD = 84;     // refresh periodically
export const CREDIT_VALUE_INR = 10;   // 1 credit = ₹10

// ─── Margin model ──────────────────────────────────────────────────────────────
// REVENUE_MULTIPLIER = 1 / (1 − net margin − gateway fee − empty-run/refund buffer).
// 60% net after ~3.5% gateway + ~5% buffer  ⇒  ≈ 3.175×. GST is charged on top
// (passthrough), so it is intentionally NOT part of this multiplier.
export const TARGET_NET_MARGIN = 0.60;
export const GATEWAY_FEE_RATE = 0.035;
export const BUFFER_RATE = 0.05;
export const REVENUE_MULTIPLIER =
  1 / (1 - TARGET_NET_MARGIN - GATEWAY_FEE_RATE - BUFFER_RATE); // ≈ 3.175

/** Convert a true USD cost into credits, marked up to hold the target margin. */
export function creditsForCostUsd(costUsd: number): number {
  if (costUsd <= 0) return 0;
  const inr = costUsd * REVENUE_MULTIPLIER * FX_INR_PER_USD;
  return Math.ceil(inr / CREDIT_VALUE_INR);
}

// ─── Customer charge model — the PUBLISHED contract ──────────────────────────
// The ONLY thing a customer is billed for is QUALIFIED leads actually delivered.
// Promised identically across the site, pricing pages and llms.txt:
//   "~2 leads per credit; you only pay for qualified leads; an empty search
//    costs nothing."
// This is the single source of truth for what a run COSTS THE CUSTOMER. The
// cost-plus COGS math above is kept only to (a) size the reserve hold and
// (b) snapshot true COGS on the ledger for internal margin tracking — it must
// never be what the wallet is actually charged.
export const LEADS_PER_CREDIT = 2;

/** Credits a customer pays for N delivered qualified leads (0 leads ⇒ 0 credits). */
export function creditsForQualifiedLeads(qualifiedLeads: number): number {
  if (qualifiedLeads <= 0) return 0;
  return Math.ceil(qualifiedLeads / LEADS_PER_CREDIT);
}

// ─── Plan & top-up ──────────────────────────────────────────────────────────────
export const PLAN_PRICE_USD = 50;
export const PLAN_CREDITS = 400;                 // granted each billing cycle
export const TOPUP_CREDIT_PRICE_INR = CREDIT_VALUE_INR; // ₹10 / credit
export const TOPUP_MIN_CREDITS = 50;
export const TOPUP_MAX_CREDITS = 5000;
export const CREDIT_EXPIRY_DAYS = 60;            // roll over once / expire after 60 days

// ─── No-subscription trial ───────────────────────────────────────────────────
// A new org can generate up to TRIAL_LEADS leads by just topping up credits —
// no subscription. Lead TRIAL_LEADS+1 requires an active subscription.
export const TRIAL_LEADS = 100;
export const TRIAL_BUFFER = 0.5;                 // 50% headroom for high-condition (audit-heavy) leads
// Minimum deposit to fund the trial: 100 leads ÷ ~2 leads/credit = 50, ×1.5 buffer = 75.
export const TRIAL_MIN_CREDITS = Math.ceil((TRIAL_LEADS / LEADS_PER_CREDIT) * (1 + TRIAL_BUFFER));

// ─── Gemini model rates (USD per 1M tokens) ──────────────────────────────────────
export const MODEL_RATES = {
  "gemini-flash-lite": { in: 0.10, out: 0.40 },
  "gemini-flash":      { in: 0.30, out: 2.50 },
} as const;
export type GeminiModel = keyof typeof MODEL_RATES;

/** Token cost for one Gemini call. */
export function geminiCostUsd(model: GeminiModel, inputTokens: number, outputTokens: number): number {
  const r = MODEL_RATES[model];
  return (inputTokens / 1_000_000) * r.in + (outputTokens / 1_000_000) * r.out;
}

// ─── Apify actor rates (USD per result) — STARTER tier ───────────────────────────
// compass/crawler-google-places, per the published pricing table.
export const ACTOR_RATES = {
  google_maps: {
    scrapedPlace:      0.004,   // $4.00 / 1,000
    filterApplied:     0.001,   // $1.00 / 1,000
    placeDetails:      0.002,   // $2.00 / 1,000
    companyContacts:   0.003,   // $3.00 / 1,000  (email/phone)
    businessLeads:     0.0075,  // $7.50 / 1,000  (decision-maker enrichment)
    emailVerification: 0.004,   // $4.00 / 1,000
    socialEnrichment:  0.010,   // $10.00 / 1,000
    actorStart:        0.00005, // per run
  },
  leads_finder: {
    perResult:         0.00067, // ~$1 / 1,500
  },
  linkedin_founder: {
    searchPage:        0.10,    // $0.10 per search page (25 results) — harvestapi/linkedin-profile-search
    fullProfileEmail:  0.01,    // $10 / 1,000 — full profile + email search & validation
  },
} as const;

// ─── Email enrichment (B2B fallback when actor lacks an email) ───────────────────
export const ENRICH_RATES = { prospeo: 0.01 } as const; // USD per verified email

// ─── On-demand LinkedIn founder-email enrichment (leads-page button) ─────────────
// An opt-in, per-lead action (NOT part of the automatic pipeline): scrape the
// company's founder on LinkedIn (harvestapi/linkedin-profile-search) and swap in
// their verified email. Worst-case actor spend is 1 search page + up to 3 full
// profiles ≈ $0.13; the customer is charged the cost-plus credit price ONLY for
// founders actually found (misses cost them nothing). Tune FOUNDER_CREDITS_PER_LEAD
// directly if you want a rounder price — the quote UI reads this constant.
export const FOUNDER_ENRICHMENT_MAX_COST_USD = 0.13;
export const FOUNDER_CREDITS_PER_LEAD = creditsForCostUsd(FOUNDER_ENRICHMENT_MAX_COST_USD); // ≈ 4 credits (₹40)

// ─── In-house website-quality probe (bandwidth/compute approximation) ────────────
export const WEBSITE_AUDIT_COST_USD = 0.0005;

// ─── Gemini per-lead pipeline cost (research + qualify + personalize) ────────────
// Approximation used in COGS reconciliation until exact per-call token capture
// lands (Phase 7). Sized to the Starter-tier build-up in the plan doc (~$0.006).
export const GEMINI_PER_LEAD_USD = 0.006;
