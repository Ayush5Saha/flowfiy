/**
 * Actor registry — the fixed set of Apify actors the Planner may choose from.
 *
 * Launch set (locked): google_maps (LOCAL) ONLY. Apify is used solely to scrape
 * businesses from Google Maps; Gemini does every downstream step (website reading,
 * research, qualification, list-building). The entry owns how to build the actor
 * input from a plan and how to normalize raw rows into the common lead shape, so
 * adding an actor back later is one entry. Discovery runs this via the PLATFORM
 * Apify token.
 */
import type { ApifyClient } from "@/integrations/apify";
import { ACTOR_RATES } from "@/lib/credits/rates";
import type { ActorKey, LeadType, ResolvedPlan } from "@/ai/criteria/types";

export interface NormalizedLead {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyName: string | null;
  companyWebsite: string | null;
  companySize: string | null;
  industry: string | null;
  city: string | null;
  linkedinUrl: string | null;
  rating: number | null;        // Google Maps star rating (attribute signal)
  reviewsCount: number | null;
  source: string;
  rawData: Record<string, unknown>;
}

export interface ActorDef {
  key: ActorKey;
  apifyActorId: string;
  leadType: LeadType;
  description: string;
  paramsSchema: Record<string, string>;
  buildInput(plan: ResolvedPlan): Record<string, unknown>;
  normalize(raw: Record<string, unknown>): NormalizedLead | null;
  /** USD per result for the COGS estimate, given the plan's enrichment toggles. */
  perResultCostUsd(plan: ResolvedPlan): number;
  /** Execute the actor via the platform Apify client and return normalized leads. */
  run(client: ApifyClient, plan: ResolvedPlan): Promise<NormalizedLead[]>;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// ─── google_maps (compass/crawler-google-places) — LOCAL businesses ─────────────

const googleMaps: ActorDef = {
  key: "google_maps",
  apifyActorId: "compass/crawler-google-places",
  leadType: "LOCAL",
  description:
    "Find local businesses by category + location (cafes, gyms, clinics, salons, " +
    "shops…). Returns name, website, email/phone (when public), rating, review " +
    "count, category and city. Best for local/SMB targeting.",
  paramsSchema: {
    search: "string  // business category/keywords, e.g. 'coffee shops'",
    location: "string  // a city or area (required), e.g. 'Mumbai'",
    maxResults: "number",
  },

  buildInput(plan) {
    const search = String(plan.params.search ?? "").trim();
    const location = String(plan.params.location ?? "").trim();
    const query = location ? `${search} in ${location}` : search;
    return {
      searchStringsArray: [query].filter(Boolean),
      maxCrawledPlacesPerSearch: Math.min(plan.maxResults, 300),
      // Scrape each place's site for email/phone unless explicitly disabled.
      scrapeContacts: plan.enrichments?.companyContacts !== false,
      skipClosedPlaces: true,
      language: "en",
    };
  },

  normalize(raw) {
    const name = str(raw.title);
    if (!name) return null;
    const emails = Array.isArray(raw.emails) ? (raw.emails as unknown[]).map(String) : [];
    const website = str(raw.website) ?? (str(raw.domain) ? `https://${str(raw.domain)}` : null);
    const linkedIns = Array.isArray(raw.linkedIns) ? (raw.linkedIns as unknown[]).map(String) : [];
    return {
      firstName: null,
      lastName: null,
      email: emails.find((e) => e && e.includes("@")) ?? null,
      phone: str(raw.phoneUnformatted) ?? str(raw.phone),
      title: null,
      companyName: name,
      companyWebsite: website,
      companySize: null,
      industry: str(raw.categoryName),
      city: str(raw.city),
      linkedinUrl: linkedIns[0] ?? null,
      rating: numOrNull(raw.totalScore),
      reviewsCount: numOrNull(raw.reviewsCount),
      source: "google_maps",
      rawData: raw,
    };
  },

  perResultCostUsd(plan) {
    const r = ACTOR_RATES.google_maps;
    const e = plan.enrichments ?? {};
    let c = r.scrapedPlace + r.filterApplied + r.placeDetails;
    if (e.companyContacts !== false) c += r.companyContacts;
    if (e.emailVerification) c += r.emailVerification;
    if (e.businessLeads) c += r.businessLeads;
    if (e.socialEnrichment) c += r.socialEnrichment;
    return c;
  },

  async run(client, plan) {
    const items = await client.runActor(this.apifyActorId, this.buildInput(plan), {
      maxItems: Math.min(plan.maxResults, 300),
    });
    return items.map((it) => this.normalize(it)).filter((l): l is NormalizedLead => l !== null);
  },
};

export const ACTORS: Record<ActorKey, ActorDef> = {
  google_maps: googleMaps,
};

/** Compact catalog for the Planner prompt (description + param schema per actor). */
export function actorCatalogForPlanner(): string {
  return (Object.values(ACTORS) as ActorDef[])
    .map(
      (a) =>
        `- ${a.key} (${a.leadType}): ${a.description}\n  params: ${JSON.stringify(a.paramsSchema)}`
    )
    .join("\n");
}
