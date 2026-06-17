import * as ic from "@/lib/icp";

// ─── Shared lead shape returned by both Apollo and Apify ─────────────────────

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

// ─── leads-finder actor output shape ─────────────────────────────────────────

interface LeadsFinderResult {
  first_name: string;
  last_name: string | null;
  full_name: string;
  job_title: string | null;
  email: string | null;
  personal_email: string | null;
  mobile_number: string | null;
  linkedin: string;
  headline: string | null;
  seniority_level: string | null;
  country: string | null;
  city: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_website: string | null;
  company_size: number | null;
  industry: string | null;
  company_description: string | null;
}

// ─── Geography → leads-finder enum mapping ───────────────────────────────────
//
// The leads-finder actor requires exact lowercase enum values for contact_location.
// This map normalises the free-text geographies stored in business profiles.

const GEO_MAP: Record<string, string> = {
  // United States
  "united states": "united states",
  "usa":           "united states",
  "us":            "united states",
  "u.s.":          "united states",
  "u.s.a.":        "united states",
  "america":       "united states",
  // India
  "india":         "india",
  // United Kingdom
  "united kingdom": "united kingdom",
  "uk":            "united kingdom",
  "england":       "england, united kingdom",
  "britain":       "united kingdom",
  "great britain": "united kingdom",
  // UAE
  "uae":                  "united arab emirates",
  "united arab emirates": "united arab emirates",
  "dubai":                "united arab emirates",
  "abu dhabi":            "united arab emirates",
  "sharjah":              "united arab emirates",
  // Other major markets
  "canada":        "canada",
  "australia":     "australia",
  "germany":       "germany",
  "france":        "france",
  "singapore":     "singapore",
  "netherlands":   "netherlands",
  "israel":        "israel",
  "ireland":       "ireland",
  "sweden":        "sweden",
  "spain":         "spain",
  "italy":         "italy",
  "brazil":        "brazil",
  "mexico":        "mexico",
  "south africa":  "south africa",
  "nigeria":       "nigeria",
  "kenya":         "kenya",
  "japan":         "japan",
  "china":         "china",
  "hong kong":     "hong kong",
  "new zealand":   "new zealand",
  "pakistan":      "pakistan",
  "bangladesh":    "bangladesh",
  "sri lanka":     "sri lanka",
  "saudi arabia":  "saudi arabia",
  "qatar":         "qatar",
  "kuwait":        "kuwait",
  "bahrain":       "bahrain",
  "oman":          "oman",
  "jordan":        "jordan",
  // US states
  "california": "california, us",
  "texas":      "texas, us",
  "new york":   "new york, us",
  "florida":    "florida, us",
  "illinois":   "illinois, us",
};

function mapGeographies(geographies: string[]): string[] {
  const results = new Set<string>();
  for (const geo of geographies) {
    const lower = geo.toLowerCase().trim();
    if (GEO_MAP[lower]) {
      results.add(GEO_MAP[lower]);
    } else {
      // Partial match fallback
      const key = Object.keys(GEO_MAP).find((k) => lower.includes(k) || k.includes(lower));
      if (key) results.add(GEO_MAP[key]);
    }
  }
  return Array.from(results);
}

// ─── Industry → leads-finder enum mapping ────────────────────────────────────

const INDUSTRY_ENUM = new Set([
  "information technology & services", "construction", "marketing & advertising",
  "real estate", "health, wellness & fitness", "management consulting",
  "computer software", "internet", "retail", "financial services",
  "consumer services", "hospital & health care", "automotive", "restaurants",
  "education management", "food & beverages", "design", "hospitality",
  "accounting", "events services", "nonprofit organization management",
  "entertainment", "electrical/electronic manufacturing",
  "leisure, travel & tourism", "professional training & coaching",
  "transportation/trucking/railroad", "law practice", "apparel & fashion",
  "architecture & planning", "mechanical or industrial engineering",
  "insurance", "telecommunications", "human resources",
  "staffing & recruiting", "sports", "legal services", "oil & energy",
  "media production", "machinery", "wholesale", "consumer goods", "music",
  "photography", "medical practice", "cosmetics", "environmental services",
  "graphic design", "business supplies & equipment",
  "renewables & environment", "facilities services", "publishing",
  "food production", "arts & crafts", "building materials", "civil engineering",
  "religious institutions", "public relations & communications",
  "higher education", "printing", "furniture", "mining & metals",
  "logistics & supply chain", "research", "pharmaceuticals",
  "individual & family services", "medical devices",
  "civic & social organization", "e-learning", "security & investigations",
  "chemicals", "government administration", "online media",
  "investment management", "farming", "writing & editing", "textiles",
  "mental health care", "primary/secondary education", "broadcast media",
  "biotechnology", "information services", "international trade & development",
  "motion pictures & film", "consumer electronics", "banking",
  "import & export", "industrial automation",
  "recreational facilities & services", "performing arts", "utilities",
  "sporting goods", "fine art", "airlines/aviation",
  "computer & network security", "maritime", "luxury goods & jewelry",
  "veterinary", "venture capital & private equity", "wine & spirits",
  "plastics", "aviation & aerospace", "commercial real estate",
  "computer games", "packaging & containers", "executive office",
  "computer hardware", "computer networking", "market research",
  "outsourcing/offshoring", "program development",
  "translation & localization", "philanthropy", "public safety",
  "alternative medicine", "museums & institutions",
]);

const INDUSTRY_ALIASES: Record<string, string> = {
  "saas":          "computer software",
  "software":      "computer software",
  "tech":          "information technology & services",
  "technology":    "information technology & services",
  "it":            "information technology & services",
  "it services":   "information technology & services",
  "ai":            "computer software",
  "fintech":       "financial services",
  "finance":       "financial services",
  "healthtech":    "hospital & health care",
  "health":        "hospital & health care",
  "healthcare":    "hospital & health care",
  "edtech":        "e-learning",
  "education":     "education management",
  "marketing":     "marketing & advertising",
  "advertising":   "marketing & advertising",
  "consulting":    "management consulting",
  "ecommerce":     "internet",
  "e-commerce":    "internet",
  "media":         "media production",
  "hr":            "human resources",
  "hr tech":       "human resources",
  "logistics":     "logistics & supply chain",
  "supply chain":  "logistics & supply chain",
  "legal":         "law practice",
  "law":           "law practice",
  "proptech":      "real estate",
  "biotech":       "biotechnology",
  "pharma":        "pharmaceuticals",
  "energy":        "oil & energy",
  "cleantech":     "renewables & environment",
  "security":      "security & investigations",
  "cybersecurity": "computer & network security",
  "recruitment":   "staffing & recruiting",
  "staffing":      "staffing & recruiting",
  "agency":        "marketing & advertising",
};

function mapIndustries(industries: string[]): string[] {
  const results = new Set<string>();
  for (const ind of industries) {
    const lower = ind.toLowerCase().trim();
    if (INDUSTRY_ENUM.has(lower)) {
      results.add(lower);
    } else if (INDUSTRY_ALIASES[lower]) {
      results.add(INDUSTRY_ALIASES[lower]);
    } else {
      const key = Object.keys(INDUSTRY_ALIASES).find((k) => lower.includes(k));
      if (key) results.add(INDUSTRY_ALIASES[key]);
    }
  }
  return Array.from(results);
}

// ─── Company size → leads-finder enum ────────────────────────────────────────

const VALID_SIZES = new Set([
  "1-10","11-20","21-50","51-100","101-200",
  "201-500","501-1000","1001-2000","2001-5000",
  "5001-10000","10001-20000","20001-50000","50000+",
]);

function mapCompanySizes(sizes: string[]): string[] {
  const result = new Set<string>();
  for (const s of sizes) {
    if (VALID_SIZES.has(s)) {
      result.add(s);
    } else {
      // Expand common shorthand ranges used in business profiles
      if (s === "11-50")   { result.add("11-20"); result.add("21-50"); }
      else if (s === "51-200") { result.add("51-100"); result.add("101-200"); }
      else if (s === "1-50")   { result.add("1-10"); result.add("11-20"); result.add("21-50"); }
    }
  }
  return Array.from(result);
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
   * is an upper bound — actual charges are by usage (typically far lower) and
   * billed to the user's own Apify credits.
   */
  private maxCharge(items: number): number {
    return Math.max(0.5, Math.round(items * 0.05 * 100) / 100);
  }

  // ─── Scrape a company website for research context ────────────────────────

  async scrapeWebsite(url: string): Promise<string> {
    const actorId = "apify~website-content-crawler";

    const runRes = await fetch(
      `${this.baseUrl}/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=5&maxTotalChargeUsd=${this.maxCharge(5)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls: [{ url }],
          maxCrawlDepth: 1,
          maxCrawlPages: 3,
          crawlerType: "cheerio",
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!runRes.ok) {
      throw new Error(`Apify scrape failed: ${runRes.status}`);
    }

    const items = await runRes.json() as Array<{ text?: string; markdown?: string }>;
    return items
      .map((item) => item.text ?? item.markdown ?? "")
      .join("\n\n")
      .slice(0, 8000);
  }

  // ─── Search leads ──────────────────────────────────────────────────────────
  //
  // Source priority (first that returns leads wins):
  //   1. compass/crawler-google-places — real businesses with a VERIFIED website,
  //      email and phone scraped from their own site (highest contact quality).
  //   2. code_crafter/leads-finder — person-level, validated emails (paid Apify).
  //   3. nexgendata/b2b-leads-finder — person-level, free-plan, guessed emails.
  //   4. Google SERP scraper — LinkedIn URLs only, no emails (last resort).

  async searchPeople(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
    companySizes?: string[];
    /** Discovery round (1-based). Higher rounds scan deeper and rotate the
     *  primary search term so top-up rounds surface NEW leads after dedup. */
    round?: number;
    /** Structured MCQ ICP answers — drive precise peakydev filters when present. */
    icp?: import("@/lib/icp").IcpAnswers;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit, companySizes, icp } = params;
    const round = Math.max(params.round ?? 1, 1);

    const locations        = mapGeographies(geographies);
    const mappedIndustries = mapIndustries(industries);
    const mappedSizes      = companySizes ? mapCompanySizes(companySizes) : [];

    // ── Primary: peakydev/leads-scraper-ppe ───────────────────────────────────
    // Person-level B2B leads WITH emails + rich ICP filters (title/industry/
    // country/seniority/size). Pay-per-event (~$0.0017/lead) so it runs on free
    // Apify plans. Best fit for title-based B2B ICPs — try it first.
    let peakyError: string | null = null;
    try {
      const peaky = await this._searchWithPeakyDev({ jobTitles, industries, geographies, sizes: mappedSizes, limit, round, icp });
      if (peaky.length > 0) return peaky;
    } catch (err) {
      peakyError = err instanceof Error ? err.message : String(err);
      console.warn("[apify] peakydev leads-scraper failed:", peakyError);
    }

    // ── Fallback: Google Maps (real businesses w/ verified website + email) ───
    try {
      const mapsLeads = await this._searchWithGoogleMaps({
        searchTerms: industries.length ? industries : jobTitles,
        location: geographies[0] ?? "",
        limit,
        round,
      });
      if (mapsLeads.length > 0) return mapsLeads;
    } catch (err) {
      console.warn("[apify] google-maps failed:", err instanceof Error ? err.message : String(err));
    }

    // ── Fallback 1: code_crafter/leads-finder ─────────────────────────────────
    let leadsFinderError: string | null = peakyError;
    try {
      const leads = await this._searchWithLeadsFinder({
        jobTitles,
        industries: mappedIndustries,
        locations,
        sizes: mappedSizes,
        limit,
        round,
      });
      if (leads.length > 0) return leads;
    } catch (err) {
      leadsFinderError = err instanceof Error ? err.message : String(err);
      console.warn("[apify] leads-finder failed, trying Google scraper fallback:", leadsFinderError);
    }

    // ── Fallback 1: nexgendata/b2b-leads-finder ───────────────────────────
    // Works via API on FREE Apify plans (unlike code_crafter/leads-finder).
    // Structured free-text filters; emails are pattern-derived, not validated.
    try {
      const nexgenLeads = await this._searchWithNexgen({ jobTitles, industries, geographies, limit, round });
      if (nexgenLeads.length > 0) return nexgenLeads;
    } catch (err) {
      console.warn("[apify] nexgen b2b-leads-finder failed:", err instanceof Error ? err.message : String(err));
    }

    // ── Fallback 2: Google SERP scraper (no emails but still useful) ──────
    try {
      const serpLeads = await this._searchWithGoogleScraper({ jobTitles, industries, geographies, limit, round });
      if (serpLeads.length > 0) return serpLeads;
    } catch (serpErr) {
      // The leads-finder error (e.g. free-plan API block) is more actionable
      // than a SERP-scraper failure — surface it when both paths fail.
      if (leadsFinderError) throw new Error(leadsFinderError);
      throw serpErr;
    }

    // Both paths returned nothing usable. Surface the primary actor's error
    // (if any) so the user sees the real reason rather than a silent empty.
    if (leadsFinderError) throw new Error(leadsFinderError);
    return [];
  }

  // ─── Private: peakydev/leads-scraper-ppe (person-level B2B + emails) ───────

  private async _searchWithPeakyDev(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    sizes: string[];
    limit: number;
    round?: number;
    icp?: import("@/lib/icp").IcpAnswers;
  }): Promise<ApifyLead[]> {
    const { jobTitles, geographies, limit, icp } = params;
    const round = Math.max(params.round ?? 1, 1);
    // This actor enforces a minimum of 100 results per run. Fetch deeper each
    // round so top-up rounds return rows beyond what earlier rounds saved (caller
    // dedups the overlap). Capped to bound pay-per-event spend (~$0.0017/lead).
    const totalResults = Math.min(Math.max(limit * round, 100), 1000);

    const input: Record<string, unknown> = { totalResults, includeEmails: true };

    if (icp) {
      // Structured ICP → precise, schema-valid filters via the central mappings.
      const titles = ic.icpJobTitles(icp);
      const seniority = ic.icpSeniority(icp);
      const country = ic.icpCountries(icp);
      const size = ic.icpEmployeeSize(icp);
      const keywords = ic.icpIndustryKeywords(icp);
      const revenue = ic.icpRevenue(icp);
      const funding = ic.icpFundingTypes(icp);
      if (titles.length)    input.personTitle = titles.slice(0, 10);
      if (seniority.length) input.seniority = seniority;
      if (country.length)   input.personCountry = country.slice(0, 5);
      if (size.length)      input.companyEmployeeSize = size;
      if (keywords.length)  input.industryKeywords = keywords.slice(0, 10);
      if (revenue.length)   input.revenue = revenue;
      if (funding.length)   input.fundingType = funding;
    } else {
      // Fallback (no structured ICP): free-text title + mapped country only.
      const COUNTRY: Record<string, string> = {
        "united states": "United States", usa: "United States", us: "United States",
        "united kingdom": "United Kingdom", uk: "United Kingdom",
        canada: "Canada", australia: "Australia", india: "India",
        germany: "Germany", france: "France", singapore: "Singapore",
        uae: "United Arab Emirates", "united arab emirates": "United Arab Emirates",
      };
      const countries = [...new Set(geographies.map((g) => COUNTRY[g.trim().toLowerCase()]).filter(Boolean))];
      if (jobTitles.length) input.personTitle = jobTitles.slice(0, 10);
      if (countries.length) input.personCountry = countries.slice(0, 5);
    }

    const runRes = await fetch(
      `${this.baseUrl}/acts/peakydev~leads-scraper-ppe/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${totalResults}&maxTotalChargeUsd=${this.maxCharge(totalResults)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`peakydev leads-scraper failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const rows = (await runRes.json()) as Array<{
      firstName?: string;
      lastName?: string;
      fullName?: string;
      position?: string;
      email?: string;
      all_emails?: string;
      linkedinUrl?: string;
      phone_numbers?: string;
      organizationName?: string;
      organizationWebsite?: string;
      organizationSize?: string;
      organizationIndustry?: string;
    }>;
    if (!Array.isArray(rows) || rows.length === 0) return [];
    // The actor emits an error/notice ROW (message in a name field, no contact)
    // instead of leads when the free monthly quota or credit is exhausted —
    // detect it so we don't save the message as a fake lead, and surface the
    // real reason so the chain can fall through.
    const blob = JSON.stringify(rows).toLowerCase();
    const realLead = rows.some((r) => r && typeof r === "object" && (r.linkedinUrl || r.email || r.organizationName));
    if (!realLead) {
      if (/exceed|run limit|monthly|upgrade|quota|not enough|usage/.test(blob)) {
        throw new Error("Apify free-plan limit reached (100 leads/month) or out of credit — upgrade Apify to fetch leads.");
      }
      const err = rows.find((r) => r && typeof r === "object" && "error" in r) as { error?: unknown } | undefined;
      throw new Error(`peakydev returned no leads: ${String(err?.error ?? "empty").slice(0, 160)}`);
    }

    const seen = new Set<string>();
    const leads: ApifyLead[] = [];
    const roundCap = limit * round;
    for (const r of rows) {
      if (leads.length >= roundCap) break;
      // Skip non-lead rows (e.g. notice/error rows have no real contact).
      if (!r.linkedinUrl && !r.email && !r.organizationName) continue;
      const first = (r.firstName ?? r.fullName?.split(" ")[0] ?? "").trim();
      if (!first) continue;
      const key = (r.linkedinUrl || r.email || r.fullName || first).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const email = (r.email ?? r.all_emails?.split(/[,;\s]+/).find(Boolean) ?? null)?.trim() || null;
      leads.push({
        firstName: first,
        lastName:  (r.lastName ?? r.fullName?.split(" ").slice(1).join(" ") ?? "").trim(),
        title:     r.position ?? null,
        email,
        phone:     r.phone_numbers?.split(/[,;\s]+/).find(Boolean) ?? null,
        linkedinUrl: r.linkedinUrl ?? null,
        organization: {
          name:          r.organizationName ?? null,
          websiteUrl:    r.organizationWebsite ?? null,
          employeeCount: r.organizationSize ? Number(String(r.organizationSize).replace(/\D/g, "")) || null : null,
          industry:      r.organizationIndustry ?? null,
        },
      });
    }
    return leads;
  }

  // ─── Private: leads-finder actor ─────────────────────────────────────────

  private async _searchWithLeadsFinder(params: {
    jobTitles: string[];
    industries: string[];
    locations: string[];
    sizes: string[];
    limit: number;
    round?: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, locations, sizes, limit } = params;
    const round = Math.max(params.round ?? 1, 1);
    // Fetch deeper each round (capped at the free-tier 100) so top-up rounds
    // return rows beyond what earlier rounds already saved; upstream dedup drops
    // the overlap, leaving the new deeper leads.
    const fetchCount = Math.min(limit * round, 100);

    const input: Record<string, unknown> = {
      contact_job_title: jobTitles.slice(0, 10),
      fetch_count:       fetchCount,
      email_status:      ["validated"],
      seniority_level:   ["founder", "owner", "c_suite", "director", "vp", "head"],
    };

    if (industries.length > 0) input.company_industry = industries.slice(0, 5);
    if (locations.length > 0)  input.contact_location  = locations.slice(0, 5);
    if (sizes.length > 0)      input.size               = sizes;

    const runRes = await fetch(
      `${this.baseUrl}/acts/code_crafter~leads-finder/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${fetchCount}&maxTotalChargeUsd=${this.maxCharge(fetchCount)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000), // 2 min — actor can be slow on first run
      }
    );

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`leads-finder actor failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const rawItems = await runRes.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

    // The actor can "succeed" but emit a single error row instead of leads
    // (e.g. free Apify plans are blocked from API runs — UI only). Detect that
    // and surface it instead of silently returning zero leads.
    const hasAnyLead = rawItems.some((it) => it && typeof it === "object" && "first_name" in it);
    if (!hasAnyLead) {
      const errRow = rawItems.find((it) => it && typeof it === "object" && "error" in it);
      const reason = errRow ? String(errRow.error) : "no leads returned";
      throw new Error(`Apify leads-finder returned no leads: ${reason.slice(0, 200)}`);
    }

    const items = rawItems as unknown as LeadsFinderResult[];

    const seenLinkedIn = new Set<string>();
    const leads: ApifyLead[] = [];

    for (const item of items) {
      // Return up to the deeper per-round count (not just `limit`) — earlier
      // rounds' rows are removed by the caller's cross-run dedup, so capping at
      // `limit` here would re-yield the same top rows every round.
      if (leads.length >= fetchCount) break;
      if (!item.first_name) continue;

      // Deduplicate by LinkedIn URL
      if (item.linkedin) {
        if (seenLinkedIn.has(item.linkedin)) continue;
        seenLinkedIn.add(item.linkedin);
      }

      const websiteUrl =
        item.company_website ??
        (item.company_domain ? `https://${item.company_domain}` : null);

      leads.push({
        firstName:  item.first_name.trim(),
        lastName:   (item.last_name ?? "").trim(),
        title:      item.job_title ?? null,
        email:      item.email ?? item.personal_email ?? null,
        linkedinUrl: item.linkedin ?? null,
        organization: {
          name:          item.company_name ?? null,
          websiteUrl,
          employeeCount: item.company_size ?? null,
          industry:      item.industry ?? null,
        },
      });
    }

    return leads;
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

  // ─── Private: nexgendata/b2b-leads-finder (free-plan friendly) ────────────
  //
  // Takes single free-text filters (jobTitle/industry/location) and runs via
  // API on free Apify plans. Returns LinkedIn-sourced contacts; primaryEmail is
  // a pattern-derived best guess (not SMTP-validated), so treat emails as
  // unverified. Charged per result on the user's own Apify credits.

  private async _searchWithNexgen(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
    round?: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;
    const round = Math.max(params.round ?? 1, 1);
    const location = geographies[0] ?? "";
    const industry = industries.length ? industries[(round - 1) % industries.length] : "";

    // This actor takes a SINGLE title per run. Sweep a window of the ICP's top
    // titles (rotated by round) so ONE round covers the ICP's breadth instead of
    // a single title — directly improves ICP match. Per-title fetch is modest to
    // bound per-result credit spend; later rounds rotate to fresh titles.
    const n = jobTitles.length;
    const titles: string[] = [];
    if (n) {
      const start = (round - 1) % n;
      for (let i = 0; i < Math.min(3, n); i++) titles.push(jobTitles[(start + i) % n]);
    } else titles.push("");
    const perTitle = Math.min(Math.max(limit, 5), 50);
    const roundCap = limit * round;

    type NexRow = {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      jobTitle?: string;
      company?: string;
      companyDomain?: string;
      linkedinUrl?: string;
      primaryEmail?: string;
      // This actor (DuckDuckGo→LinkedIn) ships title/industry inside `snippet`,
      // not as dedicated columns, e.g. "Head of Business Development - E-Commerce - LinkedIn India".
      snippet?: string;
    };

    const seen = new Set<string>();
    const leads: ApifyLead[] = [];
    let lastErr: string | null = null;

    const parseRows = (items: NexRow[]) => {
      for (const it of items) {
        if (leads.length >= roundCap) break;
        const first = (it.firstName ?? it.fullName?.split(" ")[0] ?? "").trim();
        if (!first) continue;
        if (it.linkedinUrl) {
          if (seen.has(it.linkedinUrl)) continue;
          seen.add(it.linkedinUrl);
        }
        const last = (it.lastName ?? it.fullName?.split(" ").slice(1).join(" ") ?? "").trim();
        // Recover title / industry from the snippet when the columns are absent.
        const snip = (it.snippet ?? "").replace(/\s*[-|]\s*LinkedIn\b.*$/i, "").trim();
        const segs = snip.split(/\s+[-|]\s+/).map((s) => s.trim()).filter(Boolean);
        leads.push({
          firstName: first,
          lastName:  last,
          title:     it.jobTitle ?? segs[0] ?? null,
          email:     it.primaryEmail ?? null,
          linkedinUrl: it.linkedinUrl ?? null,
          organization: {
            name:          it.company ?? null,
            websiteUrl:    it.companyDomain ? `https://${it.companyDomain}` : null,
            employeeCount: null,
            industry:      segs[1] ?? null,
          },
        });
      }
    };

    // Sweep each ICP title (per-title actor run); aggregate + dedup across them.
    for (const title of titles) {
      if (leads.length >= roundCap) break;
      try {
        const runRes = await fetch(
          `${this.baseUrl}/acts/nexgendata~b2b-leads-finder/run-sync-get-dataset-items?token=${this.apiKey}&maxTotalChargeUsd=${this.maxCharge(perTitle)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobTitle: title, industry, location, maxResults: perTitle }),
            signal: AbortSignal.timeout(120_000),
          }
        );
        if (!runRes.ok) {
          const body = await runRes.text().catch(() => "");
          lastErr = `nexgen b2b-leads-finder failed (${runRes.status}): ${body.slice(0, 160)}`;
          continue;
        }
        const items = (await runRes.json()) as NexRow[];
        if (Array.isArray(items)) parseRows(items);
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
      }
    }

    // Surface the actor error only when NOTHING came back, so the caller can fall
    // through to the next source; otherwise return whatever we gathered.
    if (leads.length === 0 && lastErr) throw new Error(lastErr);
    return leads;
  }

  // ─── Private: Google SERP scraper fallback ────────────────────────────────

  private async _searchWithGoogleScraper(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
    round?: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;
    const round = Math.max(params.round ?? 1, 1);

    // Rotate which titles lead the queries by round, and pull deeper SERP pages,
    // so top-up rounds surface different LinkedIn profiles than earlier rounds.
    const rotated = jobTitles.length
      ? [...jobTitles.slice((round - 1) % jobTitles.length), ...jobTitles.slice(0, (round - 1) % jobTitles.length)]
      : jobTitles;
    const titleSample    = rotated.slice(0, 3);
    const industrySample = industries.slice(0, 2).join(" OR ");
    const geoSample      = geographies.slice(0, 2).join(" OR ");

    const queries = titleSample.map((t) =>
      [
        `"${t}"`,
        industrySample ? `(${industrySample})` : "",
        geoSample ? `(${geoSample})` : "",
        "site:linkedin.com/in",
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    );

    const actorId  = "apify~google-search-scraper";
    const maxItems = Math.min(limit * 3 * round, 180);

    let runRes: Response;
    try {
      runRes = await fetch(
        `${this.baseUrl}/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${maxItems}&maxTotalChargeUsd=${this.maxCharge(maxItems)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queries:          queries.join("\n"),
            // Pull deeper result pages on later rounds (cap 3) to move past
            // profiles earlier rounds already captured.
            maxPagesPerQuery: Math.min(round, 3),
            languageCode:     "en",
            countryCode:      "us",
          }),
          signal: AbortSignal.timeout(90_000),
        }
      );
    } catch (err) {
      throw new Error(
        `Apify lead search timed out or failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`Apify search actor failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const items = await runRes.json() as Array<{
      title?: string;
      url?: string;
    }>;

    const seenUrls = new Set<string>();
    const leads: ApifyLead[] = [];

    const roundCap = limit * round;
    for (const item of items) {
      if (leads.length >= roundCap) break;
      if (!item.url?.includes("linkedin.com/in/")) continue;
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      const rawTitle     = (item.title ?? "").replace(/\s*\|\s*LinkedIn\s*$/, "").trim();
      const dashIdx      = rawTitle.indexOf(" - ");
      const fullName     = dashIdx !== -1 ? rawTitle.slice(0, dashIdx).trim() : rawTitle;
      const roleAndCompany = dashIdx !== -1 ? rawTitle.slice(dashIdx + 3).trim() : "";

      const pipeParts  = roleAndCompany.split(/\s*\|\s*/);
      const atParts    = pipeParts[0]?.split(/ at /i) ?? [];
      const titleStr   = (atParts[0] ?? pipeParts[0] ?? "").trim() || null;
      const companyStr = (atParts[1] ?? pipeParts[1] ?? "").trim() || null;

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName  = nameParts.slice(1).join(" ");

      if (!firstName) continue;

      leads.push({
        firstName,
        lastName,
        title:      titleStr,
        email:      null, // not available in Google SERP fallback
        linkedinUrl: item.url,
        organization: {
          name:          companyStr,
          websiteUrl:    null,
          employeeCount: null,
          industry:      industries[0] ?? null,
        },
      });
    }

    return leads;
  }

  // ─── Key validation ───────────────────────────────────────────────────────

  // ─── Generic actor runner (centralized NL pipeline) ───────────────────────
  //
  // Runs any actor synchronously and returns its raw dataset items. The actor
  // registry uses this with the platform-owned token, then normalizes the rows.

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
        signal: AbortSignal.timeout(opts.timeoutMs ?? 180_000),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Apify actor ${actorId} failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const items = (await res.json()) as unknown;
    return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
  }

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
