/* Smoke test for the onboarding website→profile pipeline (no auth needed).
 * Usage: npx tsx scripts/test-profile-extract.ts [url]
 * Verifies: SSRF guard rejects private targets, then scrape + extract a real site. */
import { readFileSync } from "fs";
import { scrapeWebsiteForProfile, ScrapeError } from "@/lib/website-scraper";
import { runProfileExtractor } from "@/ai/agents/profile-extractor";
import { AnthropicLLMClient } from "@/ai/llm";
import { getClaudeClient } from "@/ai/client";

// Minimal .env.local loader — only sets vars that aren't already in the env.
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

async function expectBlocked(url: string) {
  try {
    await scrapeWebsiteForProfile(url);
    console.error(`FAIL: ${url} was NOT blocked`);
    process.exitCode = 1;
  } catch (e) {
    if (e instanceof ScrapeError && (e.kind === "blocked_url" || e.kind === "invalid_url")) {
      console.log(`OK: ${url} blocked (${e.kind})`);
    } else {
      console.error(`FAIL: ${url} threw wrong error:`, e);
      process.exitCode = 1;
    }
  }
}

(async () => {
  console.log("— SSRF guard —");
  await expectBlocked("http://127.0.0.1:8080");
  await expectBlocked("http://192.168.1.1");
  await expectBlocked("http://localhost:3000");
  await expectBlocked("ftp://example.com");

  const target = process.argv[2] ?? "https://stripe.com";
  console.log(`\n— Scrape ${target} —`);
  const scraped = await scrapeWebsiteForProfile(target);
  console.log(`pages: ${scraped.pages.length} (${scraped.pages.map((p) => new URL(p.url).pathname).join(", ")})`);
  console.log(`total chars: ${scraped.pages.reduce((n, p) => n + p.text.length, 0)}`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\nANTHROPIC_API_KEY missing — skipping LLM extraction step.");
    return;
  }
  console.log("\n— Extract draft —");
  const client = new AnthropicLLMClient(getClaudeClient());
  const draft = await runProfileExtractor(client, scraped);
  console.log(JSON.stringify(draft, null, 2));
})().catch((e) => {
  console.error("FATAL:", e instanceof Error ? e.message : e);
  process.exit(1);
});
