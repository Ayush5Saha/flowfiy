import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // ── Core pages ────────────────────────────────────────────────────────────
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },

    // ── High-value use-case pages (India-targeted) ────────────────────────────
    { url: `${BASE_URL}/use-cases/ai-lead-generation`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/use-cases/cold-email-automation`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },

    // ── Comparison / competitor pages ─────────────────────────────────────────
    { url: `${BASE_URL}/vs/clay`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/vs/apollo`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },

    // ── Blog ──────────────────────────────────────────────────────────────────
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog/how-ai-agents-replace-sdrs`, lastModified: new Date("2026-05-10"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/blog/cold-email-personalization-2026`, lastModified: new Date("2026-05-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/blog/byok-ai-pricing-explained`, lastModified: new Date("2026-04-28"), changeFrequency: "monthly", priority: 0.75 },

    // ── Legal ─────────────────────────────────────────────────────────────────
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  return staticPages;
}