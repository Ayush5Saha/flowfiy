export class ApifyClient {
  private apiKey: string;
  private baseUrl = "https://api.apify.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async scrapeWebsite(url: string): Promise<string> {
    // Use Apify's Website Content Crawler actor
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

  async validateKey(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/users/me?token=${this.apiKey}`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
