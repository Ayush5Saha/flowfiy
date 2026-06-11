// ─── Shared lead shape returned by both Apollo and Apify ─────────────────────

export interface ApifyLead {
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
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
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit, companySizes } = params;

    const locations        = mapGeographies(geographies);
    const mappedIndustries = mapIndustries(industries);
    const mappedSizes      = companySizes ? mapCompanySizes(companySizes) : [];

    // ── Primary: Google Maps (real businesses w/ verified website + email) ────
    try {
      const mapsLeads = await this._searchWithGoogleMaps({
        searchTerms: industries.length ? industries : jobTitles,
        location: geographies[0] ?? "",
        limit,
      });
      if (mapsLeads.length > 0) return mapsLeads;
    } catch (err) {
      console.warn("[apify] google-maps failed:", err instanceof Error ? err.message : String(err));
    }

    // ── Fallback 1: code_crafter/leads-finder ─────────────────────────────────
    let leadsFinderError: string | null = null;
    try {
      const leads = await this._searchWithLeadsFinder({
        jobTitles,
        industries: mappedIndustries,
        locations,
        sizes: mappedSizes,
        limit,
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
      const nexgenLeads = await this._searchWithNexgen({ jobTitles, industries, geographies, limit });
      if (nexgenLeads.length > 0) return nexgenLeads;
    } catch (err) {
      console.warn("[apify] nexgen b2b-leads-finder failed:", err instanceof Error ? err.message : String(err));
    }

    // ── Fallback 2: Google SERP scraper (no emails but still useful) ──────
    try {
      const serpLeads = await this._searchWithGoogleScraper({ jobTitles, industries, geographies, limit });
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

  // ─── Private: leads-finder actor ─────────────────────────────────────────

  private async _searchWithLeadsFinder(params: {
    jobTitles: string[];
    industries: string[];
    locations: string[];
    sizes: string[];
    limit: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, locations, sizes, limit } = params;

    const input: Record<string, unknown> = {
      contact_job_title: jobTitles.slice(0, 10),
      fetch_count:       Math.min(limit, 100), // free tier cap = 100
      email_status:      ["validated"],
      seniority_level:   ["founder", "owner", "c_suite", "director", "vp", "head"],
    };

    if (industries.length > 0) input.company_industry = industries.slice(0, 5);
    if (locations.length > 0)  input.contact_location  = locations.slice(0, 5);
    if (sizes.length > 0)      input.size               = sizes;

    const runRes = await fetch(
      `${this.baseUrl}/acts/code_crafter~leads-finder/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${limit}&maxTotalChargeUsd=${this.maxCharge(limit)}`,
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
      if (leads.length >= limit) break;
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
  }): Promise<ApifyLead[]> {
    const { searchTerms, location, limit } = params;
    if (searchTerms.length === 0) return [];

    const input: Record<string, unknown> = {
      searchStringsArray: searchTerms.slice(0, 5),
      maxCrawledPlacesPerSearch: Math.min(limit, 100),
      scrapeContacts: true,     // crawl each place's website for emails/socials
      skipClosedPlaces: true,
      language: "en",
    };
    if (location) input.locationQuery = location;

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
      city?: string;
      categoryName?: string;
      linkedIns?: string[];
    }>;
    if (!Array.isArray(places) || places.length === 0) return [];

    const seen = new Set<string>();
    const leads: ApifyLead[] = [];
    for (const p of places) {
      if (leads.length >= limit) break;
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
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;

    const input: Record<string, unknown> = {
      jobTitle:   jobTitles[0] ?? "",
      industry:   industries[0] ?? "",
      location:   geographies[0] ?? "",
      maxResults: Math.min(Math.max(limit, 1), 500),
    };

    const runRes = await fetch(
      `${this.baseUrl}/acts/nexgendata~b2b-leads-finder/run-sync-get-dataset-items?token=${this.apiKey}&maxTotalChargeUsd=${this.maxCharge(limit)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000),
      }
    );

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`nexgen b2b-leads-finder failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const items = await runRes.json() as Array<{
      firstName?: string;
      lastName?: string;
      fullName?: string;
      jobTitle?: string;
      company?: string;
      companyDomain?: string;
      linkedinUrl?: string;
      primaryEmail?: string;
    }>;
    if (!Array.isArray(items) || items.length === 0) return [];

    const seen = new Set<string>();
    const leads: ApifyLead[] = [];
    for (const it of items) {
      if (leads.length >= limit) break;
      const first = (it.firstName ?? it.fullName?.split(" ")[0] ?? "").trim();
      if (!first) continue;
      if (it.linkedinUrl) {
        if (seen.has(it.linkedinUrl)) continue;
        seen.add(it.linkedinUrl);
      }
      const last = (it.lastName ?? it.fullName?.split(" ").slice(1).join(" ") ?? "").trim();
      leads.push({
        firstName: first,
        lastName:  last,
        title:     it.jobTitle ?? null,
        email:     it.primaryEmail ?? null,
        linkedinUrl: it.linkedinUrl ?? null,
        organization: {
          name:          it.company ?? null,
          websiteUrl:    it.companyDomain ? `https://${it.companyDomain}` : null,
          employeeCount: null,
          industry:      null,
        },
      });
    }
    return leads;
  }

  // ─── Private: Google SERP scraper fallback ────────────────────────────────

  private async _searchWithGoogleScraper(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;

    const titleSample    = jobTitles.slice(0, 3);
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
    const maxItems = Math.min(limit * 3, 90);

    let runRes: Response;
    try {
      runRes = await fetch(
        `${this.baseUrl}/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${maxItems}&maxTotalChargeUsd=${this.maxCharge(maxItems)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queries:          queries.join("\n"),
            maxPagesPerQuery: 1,
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

    for (const item of items) {
      if (leads.length >= limit) break;
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

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/users/me?token=${this.apiKey}`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
