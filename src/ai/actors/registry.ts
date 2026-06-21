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

// A single "<category> in <city>" query returns only ~20 Google Maps results
// (the centroid's top listings), so selective filters (e.g. "no website") starve.
// Fan the search across a metro's neighborhoods to surface the long tail. Unknown
// locations fall back to a single query. Areas for the markets we target most.
const CITY_AREAS: Record<string, string[]> = {
  mumbai:      ["Bandra", "Andheri", "Lower Parel", "Colaba", "Powai", "Juhu", "Dadar", "Borivali", "Thane", "Navi Mumbai"],
  "navi mumbai": ["Vashi", "Nerul", "Belapur", "Kharghar", "Airoli"],
  delhi:       ["Connaught Place", "Hauz Khas", "Saket", "Dwarka", "Rohini", "Karol Bagh", "Lajpat Nagar", "Rajouri Garden"],
  "new delhi": ["Connaught Place", "Hauz Khas", "Saket", "Dwarka", "Rohini", "Karol Bagh", "Lajpat Nagar"],
  bengaluru:   ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar", "MG Road", "Marathahalli"],
  bangalore:   ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar", "MG Road", "Marathahalli"],
  hyderabad:   ["Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitech City", "Madhapur", "Kondapur"],
  pune:        ["Koregaon Park", "Viman Nagar", "Kothrud", "Hinjewadi", "Baner", "Aundh"],
  chennai:     ["T Nagar", "Adyar", "Anna Nagar", "Velachery", "Nungambakkam", "OMR"],
  kolkata:     ["Park Street", "Salt Lake", "Ballygunge", "New Town", "Gariahat"],
  ahmedabad:   ["Navrangpura", "Satellite", "Bodakdev", "Prahlad Nagar", "Maninagar"],
  gurgaon:     ["Cyber City", "DLF Phase 1", "Sohna Road", "MG Road", "Sector 29"],
  gurugram:    ["Cyber City", "DLF Phase 1", "Sohna Road", "MG Road", "Sector 29"],
  "new york":  ["Manhattan", "Brooklyn", "Queens", "Bronx", "SoHo", "Williamsburg"],
  london:      ["Soho", "Shoreditch", "Camden", "Mayfair", "Islington", "Hackney"],
  dubai:       ["Downtown Dubai", "Dubai Marina", "Business Bay", "Deira", "Jumeirah"],
};

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
    const target = Math.min(plan.maxResults, 300);

    // Fan a known metro into neighborhood queries so a big candidate pool surfaces;
    // each query yields ~20, so pull enough neighborhoods to cover the target.
    const PER_QUERY = 20;
    const areas = CITY_AREAS[location.toLowerCase()] ?? [];
    const numAreas = Math.min(areas.length, Math.max(1, Math.ceil(target / PER_QUERY)));
    const queries = areas.length
      ? areas.slice(0, numAreas).map((a) => `${search} in ${a}, ${location}`)
      : [location ? `${search} in ${location}` : search].filter(Boolean);

    return {
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: Math.min(Math.ceil(target / queries.length), 120) || PER_QUERY,
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
    // compass/crawler-google-places does the listing + place details and scrapes
    // each site for a public email/phone when enabled. It does NOT do email
    // verification, B2B decision-maker enrichment, or social enrichment — so don't
    // charge for those: they'd inflate the estimate for work the actor never does.
    let c = r.scrapedPlace + r.filterApplied + r.placeDetails;
    if (e.companyContacts !== false) c += r.companyContacts;
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
