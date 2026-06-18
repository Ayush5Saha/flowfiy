import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { GLOSSARY } from "@/lib/seo/glossary";
import { COMPETITORS } from "@/lib/seo/competitors";
import { SOLUTIONS } from "@/lib/seo/solutions";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/founder`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/affiliates`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/use-cases`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/use-cases/ai-lead-generation`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/use-cases/cold-email-automation`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE_URL}/solutions`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...SOLUTIONS.map((s) => ({
      url: `${BASE_URL}/solutions/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.95,
    })),
    { url: `${BASE_URL}/vs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/vs/clay`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/vs/apollo`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    ...COMPETITORS.map((c) => ({
      url: `${BASE_URL}/vs/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${BASE_URL}/glossary`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...GLOSSARY.map((t) => ({
      url: `${BASE_URL}/glossary/${t.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/blog/how-to-set-up-flowfiy`, lastModified: new Date("2026-06-15"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog/how-ai-agents-replace-sdrs`, lastModified: new Date("2026-05-10"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/blog/cold-email-personalization-2026`, lastModified: new Date("2026-05-05"), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE_URL}/blog/byok-ai-pricing-explained`, lastModified: new Date("2026-04-28"), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const dynamicBlogPosts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: [{ publishedAt: "desc" }],
    });
    const staticUrls = new Set(staticPages.map((page) => page.url));
    const dynamicBlogPages: MetadataRoute.Sitemap = dynamicBlogPosts
      .map((post) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt || post.publishedAt || now,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      }))
      .filter((page) => !staticUrls.has(page.url));

    return [...staticPages, ...dynamicBlogPages];
  } catch (error) {
    console.error("Failed to load dynamic blog sitemap entries", error);
    return staticPages;
  }
}
