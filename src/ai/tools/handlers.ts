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

interface SearchLeadsInput {
  jobTitles: string[];
  industries: string[];
  companySizes: string[];
  geographies?: string[];
  limit?: number;
}

interface ScrapeWebsiteInput {
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

async function handleSearchLeads(
  input: SearchLeadsInput,
  ctx: ToolContext
): Promise<unknown> {
  if (!ctx.apolloClient) {
    throw new Error("Apollo integration not connected. Cannot search for leads.");
  }

  await ctx.log?.(`Searching Apollo for leads — titles: ${input.jobTitles.slice(0, 3).join(", ")}${input.jobTitles.length > 3 ? "..." : ""}`, "tool");

  const rawLeads = await ctx.apolloClient.searchPeople({
    jobTitles: input.jobTitles,
    industries: input.industries,
    companySizes: input.companySizes,
    geographies: input.geographies ?? ctx.geographies,
    perPage: input.limit ?? 25,
  });

  if (rawLeads.length === 0) {
    await ctx.log?.("No leads found with these filters. Consider broadening the search.", "error");
    return { leads: [], message: "No leads found with these filters. Consider broadening job titles or industries." };
  }

  await ctx.log?.(`Found ${rawLeads.length} leads from Apollo. Saving to database...`, "success");

  // Persist leads to DB immediately so save_lead_result can reference them
  const savedLeads = await Promise.all(
    rawLeads.map((raw) =>
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

  // Update list with discovered count
  await prisma.leadList.update({
    where: { id: ctx.leadListId },
    data: { totalLeads: savedLeads.length, jobStatus: "analyzing_companies" },
  });

  // Return structured lead list to Claude (with DB IDs for save_lead_result)
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
      linkedinUrl: rawLeads[i]?.linkedinUrl ?? null,
    })),
    total: savedLeads.length,
  };
}

// ─── scrape_website ───────────────────────────────────────────────────────────

async function handleScrapeWebsite(
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
