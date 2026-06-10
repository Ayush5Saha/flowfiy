import { prisma } from "@/lib/prisma";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import { fireWebhookEvent } from "@/lib/webhooks";

// ─── Context passed to every tool handler ────────────────────────────────────

export interface ToolContext {
  organizationId: string;
  leadListId: string;
  apolloClient: ApolloClient | null;
  apifyClient: ApifyClient | null;
  geographies: string[];
  /** Running totals updated as Claude calls save_lead_result */
  stats: {
    totalLeads: number;
    qualifiedLeads: number;
  };
  /** Optional log emitter — pushes a log entry to Redis for the live UI */
  log?: (msg: string, level?: "info" | "success" | "error" | "tool") => Promise<void>;
}

// ─── Tool input shapes (mirror definitions.ts schemas) ───────────────────────

export interface SearchLeadsInput {
  jobTitles: string[];
  industries: string[];
  companySizes?: string[];
  geographies?: string[];
  limit?: number;
}

export interface ScrapeWebsiteInput {
  url: string;
  leadId?: string;
}

interface SaveLeadResultInput {
  leadId: string;
  qualified: boolean;
  score: number;
  bestAngle: string;
  painPointMatch: string;
  personalizationHooks: string[];
  subjectLine?: string;
  emailBody?: string;
  followUp1?: string;
  followUp2?: string;
  followUp3?: string;
}

// ─── search_leads ─────────────────────────────────────────────────────────────
//
// Prefers Apollo when connected. If Apollo ERRORS (e.g. free-plan 403
// API_INACCESSIBLE) or returns no leads, automatically falls back to Apify
// (leads-finder actor, provides validated emails) when it is connected. At
// least one source must be present — enforced at job-queue time.

interface SearchLeadsResult {
  leads: unknown[];
  total: number;
  source: string;
  message?: string;
  note?: string;
}

// ─── Cross-run dedup ──────────────────────────────────────────────────────────
//
// Ensures a new lead-gen run never re-saves a lead the org already has (from any
// previous list). Strong keys (email, LinkedIn URL) take priority; a weak
// name+company key is used only when no strong key exists, to avoid false positives.

interface DedupableLead {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
  organization?: { name?: string | null } | null;
}

function normalizeLinkedIn(url: string): string {
  return url.toLowerCase().trim().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
}

function nameCompanyKey(first?: string | null, last?: string | null, company?: string | null): string {
  const f = (first ?? "").toLowerCase().trim();
  if (!f) return "";
  return `${f}|${(last ?? "").toLowerCase().trim()}|${(company ?? "").toLowerCase().trim()}`;
}

async function filterOutExistingLeads<T extends DedupableLead>(
  organizationId: string,
  leads: T[]
): Promise<{ fresh: T[]; duplicates: number }> {
  if (leads.length === 0) return { fresh: [], duplicates: 0 };

  const existing = await prisma.lead.findMany({
    where: { organizationId },
    select: { email: true, linkedinUrl: true, firstName: true, lastName: true, companyName: true },
  });

  const emailSet = new Set<string>();
  const liSet = new Set<string>();
  const nameSet = new Set<string>();
  for (const e of existing) {
    if (e.email) emailSet.add(e.email.toLowerCase().trim());
    if (e.linkedinUrl) liSet.add(normalizeLinkedIn(e.linkedinUrl));
    const nk = nameCompanyKey(e.firstName, e.lastName, e.companyName);
    if (nk) nameSet.add(nk);
  }

  const fresh: T[] = [];
  for (const l of leads) {
    const email = (l.email ?? "").toLowerCase().trim();
    const li = l.linkedinUrl ? normalizeLinkedIn(l.linkedinUrl) : "";
    const nk = nameCompanyKey(l.firstName, l.lastName, l.organization?.name);

    if (email && emailSet.has(email)) continue;
    if (li && liSet.has(li)) continue;
    if (!email && !li && nk && nameSet.has(nk)) continue;

    // Record this lead's keys so duplicates within the same batch are also dropped.
    if (email) emailSet.add(email);
    if (li) liSet.add(li);
    if (nk) nameSet.add(nk);
    fresh.push(l);
  }

  return { fresh, duplicates: leads.length - fresh.length };
}

export async function handleSearchLeads(
  input: SearchLeadsInput,
  ctx: ToolContext
): Promise<unknown> {
  const geographies = input.geographies ?? ctx.geographies;
  const limit = input.limit ?? 25;

  // ── Apollo first (with automatic Apify fallback on error / empty) ──────────
  if (ctx.apolloClient) {
    try {
      const result = await searchViaApollo(input, ctx, geographies, limit);
      if (result.total > 0) return result;
      // Apollo succeeded but found nothing — try Apify if we have it.
      if (!ctx.apifyClient) return result;
      await ctx.log?.("Apollo returned no matching leads — trying Apify instead...", "info");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.log?.(`Apollo lead search failed: ${msg}`, "error");
      if (!ctx.apifyClient) {
        throw new Error(
          `Apollo lead search failed and no Apify fallback is connected. ` +
            `Connect Apify in Integrations to enable automatic fallback. (${msg})`
        );
      }
      await ctx.log?.("Falling back to Apify for lead discovery...", "info");
    }
  }

  // ── Apify (primary when Apollo absent, or fallback after Apollo failure) ───
  if (ctx.apifyClient) {
    return searchViaApify(input, ctx, geographies, limit);
  }

  // ── Neither connected (should be caught at queue time, but guard here too) ─
  throw new Error(
    "No lead source connected. Please connect Apollo (recommended) or Apify in the Integrations page."
  );
}

async function searchViaApollo(
  input: SearchLeadsInput,
  ctx: ToolContext,
  geographies: string[],
  limit: number
): Promise<SearchLeadsResult> {
  const apollo = ctx.apolloClient!;
  await ctx.log?.(`Searching Apollo for leads — titles: ${input.jobTitles.slice(0, 3).join(", ")}${input.jobTitles.length > 3 ? "..." : ""}`, "tool");

  const rawLeads = await apollo.searchPeople({
    jobTitles: input.jobTitles,
    industries: input.industries,
    companySizes: input.companySizes ?? [],
    geographies,
    perPage: limit,
  });

  if (rawLeads.length === 0) {
    await ctx.log?.("No leads found in Apollo with these filters.", "info");
    return { leads: [], total: 0, source: "apollo", message: "No leads found with these filters." };
  }

  const { fresh, duplicates } = await filterOutExistingLeads(ctx.organizationId, rawLeads);
  if (duplicates > 0) {
    await ctx.log?.(`Skipped ${duplicates} lead(s) already in your workspace from previous runs.`, "info");
  }
  if (fresh.length === 0) {
    await ctx.log?.("All Apollo matches were already in your workspace. Broaden the ICP for fresh leads.", "info");
    return { leads: [], total: 0, source: "apollo", message: "All matches were duplicates of existing leads." };
  }

  await ctx.log?.(`Found ${fresh.length} new leads from Apollo. Saving to database...`, "success");

  const savedLeads = await Promise.all(
    fresh.map((raw) =>
      prisma.lead.create({
        data: {
          leadListId: ctx.leadListId,
          organizationId: ctx.organizationId,
          firstName: raw.firstName,
          lastName: raw.lastName,
          email: raw.email,
          title: raw.title,
          companyName: raw.organization?.name,
          companyWebsite: raw.organization?.websiteUrl,
          companySize: raw.organization?.employeeCount?.toString(),
          industry: raw.organization?.industry,
          linkedinUrl: raw.linkedinUrl,
          source: "apollo",
          rawData: raw as never,
          status: "RESEARCHING",
        },
      })
    )
  );

  ctx.stats.totalLeads = savedLeads.length;

  await prisma.leadList.update({
    where: { id: ctx.leadListId },
    data: { totalLeads: savedLeads.length, jobStatus: "analyzing_companies" },
  });

  return {
    leads: savedLeads.map((lead, i) => ({
      leadId: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      title: lead.title,
      email: lead.email ?? "not available",
      companyName: lead.companyName ?? "Unknown",
      companyWebsite: lead.companyWebsite ?? null,
      companySize: lead.companySize ?? "Unknown",
      industry: lead.industry ?? "Unknown",
      linkedinUrl: fresh[i]?.linkedinUrl ?? null,
    })),
    total: savedLeads.length,
    source: "apollo",
  };
}

async function searchViaApify(
  input: SearchLeadsInput,
  ctx: ToolContext,
  geographies: string[],
  limit: number
): Promise<SearchLeadsResult> {
  const apify = ctx.apifyClient!;
  await ctx.log?.(`Searching Apify for leads — titles: ${input.jobTitles.slice(0, 3).join(", ")}${input.jobTitles.length > 3 ? "..." : ""}`, "tool");

  let rawLeads: Awaited<ReturnType<NonNullable<typeof ctx.apifyClient>["searchPeople"]>>;
  try {
    rawLeads = await apify.searchPeople({
      jobTitles:    input.jobTitles,
      industries:   input.industries,
      geographies,
      limit,
      companySizes: input.companySizes,
    });
  } catch (err) {
    await ctx.log?.(`Apify lead search failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    return {
      leads: [],
      total: 0,
      source: "apify",
      message: "Apify lead search failed. Check your Apify API key or try again.",
    };
  }

  if (rawLeads.length === 0) {
    await ctx.log?.("No leads found via Apify with these filters. Consider broadening job titles, industries, or geographies.", "error");
    return { leads: [], total: 0, source: "apify", message: "No leads found with these filters. Consider broadening the search criteria." };
  }

  const { fresh, duplicates } = await filterOutExistingLeads(ctx.organizationId, rawLeads);
  if (duplicates > 0) {
    await ctx.log?.(`Skipped ${duplicates} lead(s) already in your workspace from previous runs.`, "info");
  }
  if (fresh.length === 0) {
    await ctx.log?.("All Apify matches were already in your workspace. Broaden the ICP for fresh leads.", "info");
    return { leads: [], total: 0, source: "apify", message: "All matches were duplicates of existing leads." };
  }

  const withEmails = fresh.filter((l) => l.email).length;
  await ctx.log?.(
    `Found ${fresh.length} new leads via Apify (${withEmails} with emails). Saving to database...`,
    "success"
  );

  const savedLeads = await Promise.all(
    fresh.map((raw) =>
      prisma.lead.create({
        data: {
          leadListId: ctx.leadListId,
          organizationId: ctx.organizationId,
          firstName: raw.firstName,
          lastName: raw.lastName,
          email: raw.email ?? null,
          title: raw.title ?? null,
          companyName: raw.organization?.name ?? null,
          companyWebsite: raw.organization?.websiteUrl ?? null,
          companySize: raw.organization?.employeeCount?.toString() ?? null,
          industry: raw.organization?.industry ?? null,
          linkedinUrl: raw.linkedinUrl ?? null,
          source: "apify",
          rawData: raw as never,
          status: "RESEARCHING",
        },
      })
    )
  );

  ctx.stats.totalLeads = savedLeads.length;

  await prisma.leadList.update({
    where: { id: ctx.leadListId },
    data: { totalLeads: savedLeads.length, jobStatus: "analyzing_companies" },
  });

  const emailNote = withEmails > 0
    ? `${withEmails}/${savedLeads.length} leads have validated emails.`
    : "No emails found — outreach via LinkedIn URL or company website.";

  return {
    leads: savedLeads.map((lead, i) => ({
      leadId: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      title: lead.title ?? "Unknown",
      email: lead.email ?? "not available — use LinkedIn URL or scrape company website",
      companyName: lead.companyName ?? "Unknown",
      companyWebsite: lead.companyWebsite ?? null,
      companySize: lead.companySize ?? "Unknown",
      industry: lead.industry ?? "Unknown",
      linkedinUrl: fresh[i]?.linkedinUrl ?? null,
    })),
    total: savedLeads.length,
    source: "apify",
    note: emailNote,
  };
}

// ─── scrape_website ───────────────────────────────────────────────────────────

export async function handleScrapeWebsite(
  input: ScrapeWebsiteInput,
  ctx: ToolContext
): Promise<unknown> {
  if (!ctx.apifyClient) {
    return {
      content: "",
      message: "Apify not connected. Skipping website scrape — qualify based on available data.",
    };
  }

  await ctx.log?.(`Scraping website: ${input.url}`, "tool");

  try {
    const content = await ctx.apifyClient.scrapeWebsite(input.url);
    await ctx.log?.(`Scraped ${content.length.toLocaleString()} chars from ${input.url}`, "info");
    return {
      url: input.url,
      content: content || "No content extracted from website.",
      characters: content.length,
    };
  } catch (err) {
    await ctx.log?.(`Scrape failed for ${input.url} — proceeding with available data`, "error");
    return {
      url: input.url,
      content: "",
      error: `Scrape failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      message: "Proceed with qualification based on available lead data only.",
    };
  }
}

// ─── save_lead_result ─────────────────────────────────────────────────────────

async function handleSaveLeadResult(
  input: SaveLeadResultInput,
  ctx: ToolContext
): Promise<unknown> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.leadId },
    select: { id: true, organizationId: true },
  });

  if (!lead || lead.organizationId !== ctx.organizationId) {
    throw new Error(`Lead ${input.leadId} not found or access denied.`);
  }

  const newStatus = input.qualified ? "QUALIFIED" : "DISQUALIFIED";
  const scoreLabel = input.score >= 80 ? "🟢" : input.score >= 60 ? "🟡" : "🔴";
  await ctx.log?.(
    `${scoreLabel} ${newStatus} — score ${input.score}/100`,
    input.qualified ? "success" : "info"
  );

  // Save research data
  await prisma.leadResearch.create({
    data: {
      leadId: lead.id,
      organizationId: ctx.organizationId,
      opportunityAngle: input.bestAngle,
      painPointMatch: input.painPointMatch,
      personalizationNotes: input.personalizationHooks.join("; "),
      researchMetadata: { score: input.score, hooks: input.personalizationHooks } as never,
    },
  });

  // Save outreach copy for qualified leads
  if (input.qualified && input.subjectLine && input.emailBody) {
    await prisma.outreachCopy.create({
      data: {
        leadId: lead.id,
        organizationId: ctx.organizationId,
        channel: "email",
        subjectLine: input.subjectLine,
        body: input.emailBody,
        followUp1: input.followUp1 ?? null,
        followUp2: input.followUp2 ?? null,
        followUp3: input.followUp3 ?? null,
      },
    });
    ctx.stats.qualifiedLeads++;
  }

  // Update lead status
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: newStatus, qualificationScore: input.score },
  });

  // Feature 7: fire webhook for qualified leads
  if (input.qualified) {
    void fireWebhookEvent(ctx.organizationId, "lead.qualified", {
      leadId: lead.id,
      score: input.score,
      bestAngle: input.bestAngle,
      painPointMatch: input.painPointMatch,
    });
  }

  return {
    success: true,
    leadId: lead.id,
    status: newStatus,
    score: input.score,
  };
}

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function executeLeadGenTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (toolName) {
    case "search_leads":
      return handleSearchLeads(toolInput as unknown as SearchLeadsInput, ctx);
    case "scrape_website":
      return handleScrapeWebsite(toolInput as unknown as ScrapeWebsiteInput, ctx);
    case "save_lead_result":
      return handleSaveLeadResult(toolInput as unknown as SaveLeadResultInput, ctx);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
