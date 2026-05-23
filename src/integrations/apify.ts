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

export class ApifyClient {
  private apiKey: string;
  private baseUrl = "https://api.apify.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ─── Scrape a company website for research context ────────────────────────

  async scrapeWebsite(url: string): Promise<string> {
    const actorId = "apify~website-content-crawler";

    const runRes = await fetch(
      `${this.baseUrl}/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=5`,
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

  // ─── Discover leads via Google Search (free-tier compatible) ─────────────
  //
  // Uses apify/google-search-scraper to find LinkedIn profiles matching the ICP.
  // Results have name/title/company but NOT email — that is expected on the free
  // tier. Claude will still qualify leads and write outreach; the user sends
  // via LinkedIn or finds emails separately.

  async searchPeople(params: {
    jobTitles: string[];
    industries: string[];
    geographies: string[];
    limit: number;
  }): Promise<ApifyLead[]> {
    const { jobTitles, industries, geographies, limit } = params;

    // Build targeted Google queries: "{title}" "{industry}" "{location}" site:linkedin.com/in
    const titleSample = jobTitles.slice(0, 3);
    const industrySample = industries.slice(0, 2).join(" OR ");
    const geoSample = geographies.slice(0, 2).join(" OR ");

    const queries = titleSample.map(
      (t) => `"${t}" (${industrySample}) (${geoSample}) site:linkedin.com/in`
    );

    const actorId = "apify~google-search-scraper";
    const maxItems = Math.min(limit * 3, 90); // over-fetch then dedupe

    let runRes: Response;
    try {
      runRes = await fetch(
        `${this.baseUrl}/acts/${actorId}/run-sync-get-dataset-items?token=${this.apiKey}&maxItems=${maxItems}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queries: queries.join("\n"),
            resultsPerPage: 10,
            maxPagesPerQuery: 1,
            languageCode: "en",
            countryCode: "us",
          }),
          signal: AbortSignal.timeout(90_000),
        }
      );
    } catch (err) {
      throw new Error(`Apify lead search timed out or failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!runRes.ok) {
      const body = await runRes.text().catch(() => "");
      throw new Error(`Apify search actor failed (${runRes.status}): ${body.slice(0, 200)}`);
    }

    const items = await runRes.json() as Array<{
      title?: string;
      url?: string;
      description?: string;
    }>;

    const seenUrls = new Set<string>();
    const leads: ApifyLead[] = [];

    for (const item of items) {
      if (leads.length >= limit) break;
      if (!item.url?.includes("linkedin.com/in/")) continue;
      if (seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);

      // LinkedIn SERP title format: "FirstName LastName - Title | Company | LinkedIn"
      // or "FirstName LastName - Title at Company | LinkedIn"
      const rawTitle = (item.title ?? "").replace(/\s*\|\s*LinkedIn\s*$/, "").trim();
      const dashIdx = rawTitle.indexOf(" - ");
      const fullName = dashIdx !== -1 ? rawTitle.slice(0, dashIdx).trim() : rawTitle;
      const roleAndCompany = dashIdx !== -1 ? rawTitle.slice(dashIdx + 3).trim() : "";

      // Split "Title | Company" or "Title at Company"
      const pipeParts = roleAndCompany.split(/\s*\|\s*/);
      const atParts = pipeParts[0]?.split(/ at /i) ?? [];

      const titleStr = (atParts[0] ?? pipeParts[0] ?? "").trim() || null;
      const companyStr = (atParts[1] ?? pipeParts[1] ?? "").trim() || null;

      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      if (!firstName) continue; // skip malformed entries

      leads.push({
        firstName,
        lastName,
        title: titleStr,
        email: null, // not available without paid enrichment
        linkedinUrl: item.url,
        organization: {
          name: companyStr,
          websiteUrl: null,
          employeeCount: null,
          industry: industries[0] ?? null,
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
