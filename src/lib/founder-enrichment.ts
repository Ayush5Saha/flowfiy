/**
 * On-demand founder-email enrichment — shared eligibility + pricing helpers.
 *
 * This feature is OPT-IN and separate from the automatic lead pipeline: the user
 * clicks a button on the leads page to buy a founder's LinkedIn email for one lead
 * or all of them. The quote endpoint, the enqueue endpoint and the worker all agree
 * on "which leads are eligible" through the single predicate below, so the credits
 * we quote, hold and charge always line up.
 */
import { isGenericEmail } from "@/integrations/linkedin-founder";

export { FOUNDER_CREDITS_PER_LEAD } from "@/lib/credits/rates";

/** The founder-enrichment outcome we stamp onto LeadResearch.researchMetadata. */
export interface FounderEnrichmentRecord {
  outcome:
    | "found"
    | "no_email"
    | "no_match"
    | "error"
    | "skipped_has_contact"
    | "skipped_no_company"
    | "skipped_insufficient_credits"
    | "disabled";
  founderName?: string;
  founderTitle?: string;
  founderLinkedinUrl?: string;
  emailStatus?: string;
  qualityScore?: number;
  profilesScraped?: number;
  costUsd?: number;
  creditsCharged?: number;
  at: string;
}

/** The minimal lead shape the eligibility check needs. */
export interface EnrichmentCandidate {
  firstName?: string | null;
  email?: string | null;
  companyName?: string | null;
  research?: { researchMetadata?: unknown } | null;
}

/** Has this lead already been attempted (any outcome)? One attempt per lead via
 *  the button — a repeat would re-spend Apify budget for no new value. */
export function founderEnrichmentAttempted(lead: EnrichmentCandidate): boolean {
  const meta = (lead.research?.researchMetadata ?? null) as Record<string, unknown> | null;
  return !!meta && !!meta.founderEnrichment;
}

/** Does this lead already have a real decision-maker email (named person + a
 *  non-generic mailbox)? If so there's nothing to buy. */
export function hasDecisionMakerEmail(lead: EnrichmentCandidate): boolean {
  const email = (lead.email ?? "").trim();
  const named = !!(lead.firstName ?? "").trim();
  return named && !!email && !isGenericEmail(email);
}

/**
 * Eligible = we can meaningfully spend a founder lookup on this lead:
 *   - it has a company name to search on,
 *   - it hasn't already been attempted, and
 *   - it doesn't already have a decision-maker email.
 * Used by the quote (to count/price), the enqueue route (to pick leads) and the
 * worker (as a final guard so a stale enqueue never double-charges).
 */
export function isFounderEnrichmentEligible(lead: EnrichmentCandidate): boolean {
  if (!(lead.companyName ?? "").trim()) return false;
  if (founderEnrichmentAttempted(lead)) return false;
  if (hasDecisionMakerEmail(lead)) return false;
  return true;
}
