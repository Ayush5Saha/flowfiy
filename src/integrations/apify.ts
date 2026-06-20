// Apify client — LAUNCH BUILD.
//
// Locked to a SINGLE actor: compass/crawler-google-places (Google Maps). Apify's
// only job is to scrape businesses from Google Maps. Everything downstream —
// reading each company's website, research, qualification and list-building — is
// done by Gemini (no second Apify actor, no website-content-crawler here). The
// retired person/B2B actors (peakydev, leads-finder, nexgen, SERP) were removed
// for first launch; re-add them as private methods + a source-priority chain in
// searchPeople when they return.

// ─── Shared lead shape ───────────────────────────────────────────────────────

export interface ApifyLead {
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone?: string | null;
  linkedinUrl: string | null;
  organization?: {
    name: string | null;
    websiteUrl: string | null;
    employeeCount: number | null;
    industry: string | null;
  };
}

// ─── Google Maps location expansion ──────────────────────────────────────────
//
// Google Maps searches around a single geocoded point, so a whole-country
// location like "India" returns almost nothing. Expand known countries into
// their major business cities and search "<business type> in <city>" so the
// scraper actually finds listings (with emails) across the market.

const COUNTRY_CITIES: Record<string, string[]> = {
  india: ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad"],
  "united states": ["New York", "Los Angeles", "Chicago", "Houston", "Austin", "San Francisco", "Miami", "Atlanta"],
  usa: ["New York", "Los Angeles", "Chicago", "Houston", "Austin", "San Francisco", "Miami", "Atlanta"],
  "united kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Bristol"],
  uk: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Bristol"],
  canada: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
  australia: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  "united arab emirates": ["Dubai", "Abu Dhabi", "Sharjah"],
  uae: ["Dubai", "Abu Dhabi", "Sharjah"],
  germany: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  singapore: ["Singapore"],
};

function expandLocationToCities(location: string): string[] {
  const key = location.toLowerCase().trim();
  if (COUNTRY_CITIES[key]) return COUNTRY_CITIES[key];
  return location.trim() ? [location.trim()] : [""];
}

// ─── ApifyClient ──────────────────────────────────────────────────────────────

export class ApifyClient {
  private apiKey: string;
  private baseUrl = "https://api.apify.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Apify rejects pay-per-result actor runs whose max cost cap is below $0.50
   * ("max-total-charge-usd-below-minimum"). Return an explicit per-run cap that
   * clears that minimum and scales modestly with the requested item count. This
   * is an upper bound — actual charges are by usage (typically far lower).
   */
  private maxCharge(items: number): number {
    return Math.max(0.5, Math.round(items * 0.05 * 100) / 100);
  }

  // ─── Search leads (Google Maps only) ────────────────────────────────────────
  //
  // Scrapes real businesses from Google Maps and their websites for contact
  // details. The `jobTitles`/`industries`/`companySizes`/`icp` params are kept
  // for call-site compatibility; at launch the search is driven by the business
  // category terms (industries, falling back to jobTitles) + the first geography.
  // Gemini does all research and qualification on the results downstream.

  async searchPeople(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
    companySizes?: string[];
    /** Discovery round (1-based). Higher rounds scan deeper + rotate cities so
     *  top-up rounds surface NEW businesses after dedup. */
    round?: number;
    /** Accepted for compatibility; unused by the Google Maps source. */
    icp?: import("@/lib/icp").IcpAnswers;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;
    const round = Math.max(params.round ?? 1, 1);
    return this._searchWithGoogleMaps({
      searchTerms: industries.length ? industries : jobTitles,
      location: geographies[0] ?? "",
      limit,
      round,
    });
  }

  // ─── Private: compass/crawler-google-places (Google Maps + contacts) ──────
  //
  // Scrapes Google Maps businesses and their websites for real contact details.
  // Only returns places that have BOTH a website and a scraped email (the
  // "proper contact details" quality bar). Business-level leads (no person
  // name) — best for local/SMB outreach.

  private async _searchWithGoogleMaps(params: {
    searchTerms: string[];
    location: string;
    limit: number;
    round?: number;
  }): Promise<ApifyLead[]> {
    const { searchTerms, location, limit } = params;
    const round = Math.max(params.round ?? 1, 1);
    const terms = searchTerms.map((t) => t.trim()).filter((t) => t && t.toLowerCase() !== "other");
    if (terms.length === 0) return [];

    // Build "<business type> in <city>" queries across the market's major cities
    // so Google Maps returns real listings (a bare country query returns ~none).
    // On later rounds, rotate the city order so the query set leads with cities
    // not yet emphasised, and crawl DEEPER per search. Google Maps returns the
    // same top results for an identical query, so depth + rotation (plus upstream
    // dedup) is what surfaces NEW businesses on each top-up round.
    const allCities = expandLocationToCities(location);
    const rot = (round - 1) % Math.max(allCities.length, 1);
    const cities = allCities.length > 1 ? [...allCities.slice(rot), ...allCities.slice(0, rot)] : allCities;
    const queries: string[] = [];
    for (const term of terms.slice(0, 4)) {
      for (const city of cities) {
        queries.push(city ? `${term} in ${city}` : term);
      }
    }
    const searchStringsArray = queries.slice(0, 16);
    // Spread the candidate budget across the queries (>=4 places each), and dig
    // deeper each round so we move past the listings earlier rounds already saved.
    const perSearch = Math.max(4, Math.ceil(limit / searchStringsArray.length)) * round;

    const input: Record<string, unknown> = {
      searchStringsArray,
      maxCrawledPlacesPerSearch: Math.min(perSearch, 120),
      scrapeContacts: true,     // crawl each place's website for emails/socials
      skipClosedPlaces: true,
      language: "en",
    };

    const runRes = await fetch(
      `${this.baseUrl}/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${this.apiKey}&maxTotalChargeUsd=${this.maxCharge(limit)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`google-maps actor failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const places = (await runRes.json()) as Array<{
      title?: string;
      website?: string;
      domain?: string;
      emails?: string[];
      phone?: string;
      phoneUnformatted?: string;
      city?: string;
      categoryName?: string;
      linkedIns?: string[];
    }>;
    if (!Array.isArray(places) || places.length === 0) return [];

    const seen = new Set<string>();
    const leads: ApifyLead[] = [];
    // Return up to the deeper per-round count — the caller dedups against
    // earlier rounds and trims to the candidate target, so capping at `limit`
    // here would re-yield the same top businesses every round.
    const roundCap = limit * round;
    for (const p of places) {
      if (leads.length >= roundCap) break;
      const email = p.emails?.find((e) => !!e) ?? null;
      const website = p.website || (p.domain ? `https://${p.domain}` : null);

      // Quality gate at the source: must have a website AND a real email.
      if (!email || !website) continue;

      const key = email.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      leads.push({
        firstName: "",
        lastName: "",
        title: null,
        email,
        phone: p.phoneUnformatted ?? p.phone ?? null,
        linkedinUrl: p.linkedIns?.[0] ?? null,
        organization: {
          name: p.title ?? null,
          websiteUrl: website,
          employeeCount: null,
          industry: p.categoryName ?? null,
        },
      });
    }
    return leads;
  }

  // ─── Generic actor runner (centralized NL pipeline) ───────────────────────
  //
  // Runs any actor synchronously and returns its raw dataset items. The actor
  // registry uses this with the platform-owned token for the Google Maps actor,
  // then normalizes the rows.

  async runActor(
    actorId: string,
    input: Record<string, unknown>,
    opts: { maxItems?: number; maxTotalChargeUsd?: number; timeoutMs?: number } = {}
  ): Promise<Record<string, unknown>[]> {
    const slug = actorId.replace("/", "~");
    const qs = new URLSearchParams({ token: this.apiKey });
    if (opts.maxItems) qs.set("maxItems", String(opts.maxItems));
    qs.set("maxTotalChargeUsd", String(opts.maxTotalChargeUsd ?? this.maxCharge(opts.maxItems ?? 100)));

    const res = await fetch(
      `${this.baseUrl}/acts/${slug}/run-sync-get-dataset-items?${qs.toString()}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 280_000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Apify actor ${actorId} failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const items = (await res.json()) as unknown;
    return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
  }

  // ─── Key validation ───────────────────────────────────────────────────────

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/users/me?token=${this.apiKey}`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

/** Platform-owned Apify client for the centralized NL pipeline. Null if unset. */
export function getPlatformApifyClient(): ApifyClient | null {
  const token = process.env.APIFY_PLATFORM_TOKEN;
  return token ? new ApifyClient(token) : null;
}
