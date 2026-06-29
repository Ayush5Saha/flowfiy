import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { FEATURES } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { generationRateLimit } from "@/lib/rate-limit";
import { scrapeWebsiteForProfile, ScrapeError } from "@/lib/website-scraper";
import { getCentralLLMClient } from "@/ai/client";
import { runProfileExtractor, type ProfileDraft } from "@/ai/agents/profile-extractor";

const schema = z.object({
  organizationId: z.string().uuid(),
  url: z.string().min(1).max(2000),
});

const TONES = ["professional", "conversational", "direct"] as const;
const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;

function clampStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function clampArr(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, max);
}

/** Defensive server-side normalization — the model output is untrusted. */
function sanitizeDraft(raw: ProfileDraft): ProfileDraft {
  const geographies = clampArr(raw.targetGeographies, 5);
  const tone = TONES.includes(raw.outreachTone) ? raw.outreachTone : "professional";
  const size = SIZES.includes(raw.companySizeRange as (typeof SIZES)[number])
    ? (raw.companySizeRange as ProfileDraft["companySizeRange"])
    : null;
  const confidence = typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
    ? Math.min(1, Math.max(0, raw.confidence))
    : 0;

  return {
    companyName: clampStr(raw.companyName, 200),
    serviceOffered: clampStr(raw.serviceOffered, 1000),
    icpDescription: clampStr(raw.icpDescription, 2000),
    targetIndustries: clampArr(raw.targetIndustries, 5),
    targetGeographies: geographies.length ? geographies : ["Global"],
    companySizeRange: size,
    painPointsSolved: clampStr(raw.painPointsSolved, 1000),
    offerPositioning: clampStr(raw.offerPositioning, 1000),
    outreachTone: tone,
    confidence,
    warnings: clampArr(raw.warnings, 10),
  };
}

async function getOrgMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
}

export async function POST(req: NextRequest) {
  if (!FEATURES.websiteImport) {
    return NextResponse.json({ error: "Website import is coming soon." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid organization and URL." }, { status: 400 });
  }

  const { organizationId, url } = parsed.data;
  const member = await getOrgMembership(user.id, organizationId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Max 5 website analyses per minute per org — scraping + LLM is expensive.
  const { success } = await generationRateLimit.limit(`profile-analyze:${organizationId}`);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
  }

  let scraped: Awaited<ReturnType<typeof scrapeWebsiteForProfile>>;
  try {
    scraped = await scrapeWebsiteForProfile(url);
  } catch (err) {
    if (err instanceof ScrapeError) {
      const status = err.kind === "unreachable" ? 502 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: "We couldn't read that website. Try entering your profile manually." }, { status: 502 });
  }

  let draft: ProfileDraft;
  try {
    // Platform-funded Gemini (same key as the lead pipeline) — keeps website
    // import free for users and off the metered Anthropic key.
    const { client } = getCentralLLMClient("profileExtractor");
    const raw = await runProfileExtractor(client, { pages: scraped.pages, finalUrl: scraped.finalUrl });
    draft = sanitizeDraft(raw);
  } catch {
    return NextResponse.json(
      { error: "We read your site but couldn't draft a profile. Please enter it manually." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    draft,
    confidence: draft.confidence,
    warnings: draft.warnings,
    analyzedUrl: scraped.finalUrl,
  });
}
