/**
 * LinkedIn founder enrichment — decision-maker email resolution.
 *
 * Google Maps leads arrive with a generic website email (info@/contact@…). This
 * module finds the company's FOUNDER on LinkedIn via the Apify actor
 * harvestapi/linkedin-profile-search (pay-per-event: $0.10 per search page of 25
 * results + $0.01 per full profile scraped with email search) so personalization
 * and sending can target a real person with a verified email.
 *
 * Everything here is pure + self-contained (no DB, no network) so the processor
 * can unit-test the matching/parsing without an actor run. Metered into run COGS
 * as ACTOR_RATES.linkedin_founder.
 */
import { ACTOR_RATES } from "@/lib/credits/rates";

// ─── Actor id + kill-switch ──────────────────────────────────────────────────

export const FOUNDER_ENRICHMENT_ACTOR_ID = "harvestapi/linkedin-profile-search";

/** True when the platform Apify token is set AND the env kill-switch is not off.
 *  Default ON — set FOUNDER_ENRICHMENT_ENABLED="false" to disable the stage. */
export function founderEnrichmentEnabled(): boolean {
  return (
    !!process.env.APIFY_PLATFORM_TOKEN &&
    process.env.FOUNDER_ENRICHMENT_ENABLED !== "false"
  );
}

// ─── Generic-email detection ─────────────────────────────────────────────────
//
// A generic role mailbox (info@, contact@, sales@…) is NOT a decision-maker, so
// its presence should NOT block founder enrichment. Match on the local part only.

const GENERIC_LOCAL_PART =
  /^(info|contact|hello|hi|support|sales|admin|office|enquiry|enquiries|inquiry|inquiries|mail|team|hr|careers|help|reception|booking|bookings|feedback|service|services|marketing|accounts|billing)$/i;

export function isGenericEmail(email: string): boolean {
  const local = (email.split("@")[0] ?? "").trim();
  return GENERIC_LOCAL_PART.test(local);
}

// ─── Actor input builder ─────────────────────────────────────────────────────
//
// Hard cost caps: 1 search page + max 3 full profiles = $0.13 worst case.
// A precise LinkedIn company URL (currentCompanies) beats a name search, which
// LinkedIn treats loosely even with the exact-phrase operator.

const FOUNDER_JOB_TITLES = [
  "Founder",
  "Co-Founder",
  "CEO",
  "Owner",
  "Managing Director",
  "Proprietor",
  "Director",
];

export function buildFounderSearchInput(lead: {
  companyName: string;
  city?: string | null;
  linkedinUrl?: string | null;
}): Record<string, unknown> {
  const input: Record<string, unknown> = {
    profileScraperMode: "Full + email search",
    currentJobTitles: FOUNDER_JOB_TITLES,
    maxItems: 3,
    takePages: 1,
  };

  const companyUrl = (lead.linkedinUrl ?? "").trim();
  if (/linkedin\.com\/company\//i.test(companyUrl)) {
    // Precise LinkedIn company filter — no free-text search needed.
    input.currentCompanies = [companyUrl];
  } else {
    // LinkedIn exact-phrase operator: wrap the company name in double quotes.
    input.searchQuery = `"${lead.companyName.trim()}"`;
  }

  const city = (lead.city ?? "").trim();
  if (city) input.locations = [city];

  return input;
}

// ─── Actor output types + tolerant parser ────────────────────────────────────

export interface FounderEmail {
  email: string;
  status: string; // "valid" | "risky" | others
  qualityScore: number; // 0-100
  free: boolean;
  catchAllDomain: boolean;
  validEmailServer: boolean;
}

export interface FounderProfile {
  firstName: string;
  lastName: string;
  headline: string;
  linkedinUrl: string;
  title: string; // best position string
  companyNames: string[];
  city: string;
  emails: FounderEmail[];
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}
function bool(v: unknown): boolean {
  return v === true;
}

/** The actor returns `currentPosition`/`experience` as an array, a single object,
 *  or nothing — probe all three shapes and never throw. */
function asObjectArray(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  }
  if (v && typeof v === "object") return [v as Record<string, unknown>];
  return [];
}

function dedupeStrings(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const t = s.trim();
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function parseEmails(v: unknown): FounderEmail[] {
  if (!Array.isArray(v)) return [];
  const out: FounderEmail[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    const email = str(o.email);
    if (!email) continue;
    out.push({
      email,
      status: str(o.status).toLowerCase(),
      qualityScore: num(o.qualityScore),
      free: bool(o.free),
      catchAllDomain: bool(o.catchAllDomain),
      validEmailServer: bool(o.validEmailServer),
    });
  }
  return out;
}

/** Read one company name off a position/experience entry, tolerating the nested
 *  `company: { name }` shape as well as the flat `companyName`. */
function companyNameOf(entry: Record<string, unknown>): string[] {
  const names: string[] = [];
  const direct = str(entry.companyName);
  if (direct) names.push(direct);
  const company = entry.company;
  if (company && typeof company === "object") {
    const nested = str((company as Record<string, unknown>).name);
    if (nested) names.push(nested);
  }
  return names;
}

/** Normalize a raw actor item into a FounderProfile. Probes shapes defensively
 *  (like `firstEnrichedPerson` in ai/actors/registry.ts) and never throws. */
export function parseFounderProfile(raw: Record<string, unknown>): FounderProfile {
  const firstName = str(raw.firstName);
  const lastName = str(raw.lastName);
  const headline = str(raw.headline);
  const linkedinUrl = str(raw.linkedinUrl) || str(raw.publicIdentifier);

  const positions = asObjectArray(raw.currentPosition);
  const experience = asObjectArray(raw.experience).slice(0, 3);

  // Best title: the first non-empty position string on a current position, else
  // fall back to the headline (still useful for display + title matching).
  let title = "";
  for (const p of positions) {
    const t = str(p.position);
    if (t) {
      title = t;
      break;
    }
  }
  if (!title) title = headline;

  // Candidate company names: current positions + the first 3 experience rows.
  const companyNames: string[] = [];
  for (const p of positions) companyNames.push(...companyNameOf(p));
  for (const e of experience) companyNames.push(...companyNameOf(e));

  // City off `location.parsed.city` when present.
  let city = "";
  const loc = raw.location;
  if (loc && typeof loc === "object") {
    const parsed = (loc as Record<string, unknown>).parsed;
    if (parsed && typeof parsed === "object") {
      city = str((parsed as Record<string, unknown>).city);
    }
  }

  return {
    firstName,
    lastName,
    headline,
    linkedinUrl,
    title,
    companyNames: dedupeStrings(companyNames),
    city,
    emails: parseEmails(raw.emails),
  };
}

// ─── Email selection ─────────────────────────────────────────────────────────
//
// Accept "valid" outright; accept "risky" only when the score + server checks
// suggest it will still deliver. `free: true` (gmail etc.) is fine — Indian SMB
// founders commonly use free mailboxes.

export function pickBestEmail(
  profile: FounderProfile
): { email: string; status: string; qualityScore: number } | null {
  const acceptable = profile.emails.filter((e) => {
    if (e.status === "valid") return true;
    if (e.status === "risky" && e.qualityScore >= 60 && e.validEmailServer) return true;
    return false;
  });
  if (acceptable.length === 0) return null;

  acceptable.sort((a, b) => {
    // "valid" ahead of everything else, then higher quality score first.
    const av = a.status === "valid" ? 1 : 0;
    const bv = b.status === "valid" ? 1 : 0;
    if (av !== bv) return bv - av;
    return b.qualityScore - a.qualityScore;
  });

  const best = acceptable[0];
  return { email: best.email, status: best.status, qualityScore: best.qualityScore };
}

// ─── Founder ⇄ lead matching (deterministic, no LLM) ─────────────────────────
//
// A search for "Wingify" once returned founders of unrelated companies, so this
// validation is the correctness core: a profile only matches when its company
// AND its title line up with the lead. Exact token subset — no fuzzy scores.

const LEGAL_SUFFIX =
  /\b(private\s+limited|pvt\s+ltd|pvt|ltd|limited|llp|llc|inc|corp|corporation|company|co)\b/g;
const COMPANY_STOPWORDS = new Set(["the", "and", "of", "in", "for"]);
const TITLE_RE =
  /founder|co-?founder|ceo|chief executive|owner|managing director|proprietor|\bdirector\b/i;

/** lowercase → strip punctuation → strip legal suffixes → collapse whitespace. */
function normalizeCompany(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(LEGAL_SUFFIX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Significant tokens: length > 2, excluding the common stopwords. */
function significantTokens(normalized: string): string[] {
  return normalized
    .split(" ")
    .filter((t) => t.length > 2 && !COMPANY_STOPWORDS.has(t));
}

/** Every token of `subset` is present in `superset` (exact token membership). */
function isTokenSubset(subset: string[], superset: string[]): boolean {
  if (subset.length === 0) return false;
  const set = new Set(superset);
  return subset.every((t) => set.has(t));
}

/** Company match: the lead's significant tokens are a subset of a candidate's,
 *  or vice-versa. Candidates are the profile's company names + its headline.
 *  The candidate→lead direction requires ≥2 candidate tokens: a single generic
 *  token (profile company "Apex" vs lead "Apex Solutions Mumbai") would match a
 *  similarly-named but different business — and a wrong founder email is worse
 *  than falling back to the website contact. */
function companyMatches(leadCompany: string, candidates: string[]): boolean {
  const leadTokens = significantTokens(normalizeCompany(leadCompany));
  if (leadTokens.length === 0) return false;
  for (const cand of candidates) {
    const candTokens = significantTokens(normalizeCompany(cand));
    if (candTokens.length === 0) continue;
    if (isTokenSubset(leadTokens, candTokens)) return true;
    if (candTokens.length >= 2 && isTokenSubset(candTokens, leadTokens)) return true;
  }
  return false;
}

function titleMatches(profile: FounderProfile): boolean {
  return TITLE_RE.test(profile.title) || TITLE_RE.test(profile.headline);
}

/** Founder > co-founder > ceo > owner > managing director/proprietor > director. */
function titlePriority(profile: FounderProfile): number {
  const t = `${profile.title} ${profile.headline}`.toLowerCase();
  if (/founder|co-?founder/.test(t)) return 5;
  if (/ceo|chief executive/.test(t)) return 4;
  if (/owner/.test(t)) return 3;
  if (/managing director|proprietor/.test(t)) return 2;
  if (/\bdirector\b/.test(t)) return 1;
  return 0;
}

export function matchFounderToLead(
  profiles: FounderProfile[],
  lead: { companyName: string; city?: string | null }
): FounderProfile | null {
  const leadCity = (lead.city ?? "").trim().toLowerCase();

  const survivors = profiles.filter((p) => {
    const candidates = [...p.companyNames, p.headline];
    return companyMatches(lead.companyName, candidates) && titleMatches(p);
  });
  if (survivors.length === 0) return null;

  survivors.sort((a, b) => {
    const byTitle = titlePriority(b) - titlePriority(a);
    if (byTitle !== 0) return byTitle;
    const byEmail = (pickBestEmail(b) ? 1 : 0) - (pickBestEmail(a) ? 1 : 0);
    if (byEmail !== 0) return byEmail;
    const ac = leadCity && a.city.toLowerCase().includes(leadCity) ? 1 : 0;
    const bc = leadCity && b.city.toLowerCase().includes(leadCity) ? 1 : 0;
    return bc - ac;
  });

  return survivors[0];
}

// ─── COGS ────────────────────────────────────────────────────────────────────

/** Actor cost for one run: 1 search page + one $0.01 event per full profile. */
export function founderRunCostUsd(profilesScraped: number): number {
  const r = ACTOR_RATES.linkedin_founder;
  return r.searchPage + r.fullProfileEmail * Math.max(0, profilesScraped);
}
