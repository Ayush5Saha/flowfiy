import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

// Never expose the authenticated app surface to any crawler.
const DISALLOW = [
  "/dashboard",
  "/leads",
  "/campaigns",
  "/integrations",
  "/billing",
  "/settings",
  "/api/",
  "/onboarding",
];

// Generative + answer engines. Explicitly welcomed so Flowfiy can be crawled,
// cited, and surfaced in AI Overviews / ChatGPT / Perplexity / Claude answers.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "cohere-ai",
  "Meta-ExternalAgent",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
