/**
 * Criteria-aware discovery for the NL pipeline.
 *
 * Reads the LeadRequest plan → runs the chosen actor (platform Apify) →
 * dedups → runs referenced signal probes (website audit) → applies the criteria
 * funnel (hard filter) → enriches missing B2B emails (Prospeo) → keeps leads with
 * a usable contact path → saves + fans out research. Records COGS meta for
 * reconciliation. Unlike the legacy path, it does NOT require email+website — so
 * "no website" / phone-only targets survive.
 */
import { prisma } from "@/lib/prisma";
import { getPlatformApifyClient } from "@/integrations/apify";
import { getProspeoClient } from "@/integrations/prospeo";
import { ACTORS, type NormalizedLead } from "@/ai/actors/registry";
import { evaluateLead, signalProvidersFor, type LeadSignals } from "@/ai/criteria/engine";
import { resolveCrawl } from "@/ai/config";
import { auditWebsite } from "@/lib/website-audit";
import type { ResolvedPlan } from "@/ai/criteria/types";
import { appendLog, clearLogs } from "@/lib/job-logs";
import { getLeadResearchQueue } from "@/workers/queues";
import { markListReady, finalizeOrTopUp } from "@/lib/pipeline-finalization";

type Log = (msg: string, level?: "info" | "success" | "error" | "tool") => Promise<void>;

function domainOf(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").trim();
}

/** Dedup normalized leads against the org's existing leads + within the batch. */
async function dedup(organizationId: string, leads: NormalizedLead[]): Promise<NormalizedLead[]> {
  const existing = await prisma.lead.findMany({
    where: { organizationId },
    select: { email: true, companyWebsite: true, companyName: true, linkedinUrl: true },
  });
  const seen = new Set<string>();
  for (const e of existing) {
    if (e.email) seen.add(`e:${e.email.toLowerCase().trim()}`);
    if (e.linkedinUrl) seen.add(`l:${e.linkedinUrl.toLowerCase().trim()}`);
    if (e.companyWebsite) seen.add(`w:${domainOf(e.companyWebsite).toLowerCase()}`);
    if (e.companyName) seen.add(`n:${e.companyName.toLowerCase().trim()}`);
  }
  const out: NormalizedLead[] = [];
  for (const l of leads) {
    const keys: string[] = [];
    if (l.email) keys.push(`e:${l.email.toLowerCase().trim()}`);
    if (l.linkedinUrl) keys.push(`l:${l.linkedinUrl.toLowerCase().trim()}`);
    if (l.companyWebsite) keys.push(`w:${domainOf(l.companyWebsite).toLowerCase()}`);
    if (!l.email && !l.linkedinUrl && l.companyName) keys.push(`n:${l.companyName.toLowerCase().trim()}`);
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(l);
  }
  return out;
}

export async function runNlDiscovery(opts: {
  organizationId: string;
  leadListId: string;
  leadRequestId: string;
  round?: number;
}): Promise<void> {
  const { organizationId, leadListId, leadRequestId } = opts;
  const round = Math.max(1, opts.round ?? 1);
  const log: Log = (m, l = "info") => appendLog(leadListId, m, l);

  if (round === 1) await clearLogs(leadListId);
  await log(round === 1 ? "Starting your lead search…" : `Searching for more (round ${round})…`, "info");

  const lr = await prisma.leadRequest.findUnique({ where: { id: leadRequestId } });
  if (!lr || !lr.plan) throw new Error("Lead request or plan missing");
  const plan = lr.plan as unknown as ResolvedPlan;
  const target = plan.maxResults;

  const apify = getPlatformApifyClient();
  if (!apify) throw new Error("APIFY_PLATFORM_TOKEN is not configured.");

  await prisma.leadList.update({
    where: { id: leadListId },
    data: { status: "RESEARCHING", jobStatus: "discovering_leads", discoveryRound: round },
  });
  await prisma.leadRequest.update({ where: { id: leadRequestId }, data: { status: "RUNNING" } });

  // Only fetch the REMAINING gap to target — earlier rounds already delivered some.
  const alreadyQualified = await prisma.lead.count({ where: { leadListId, status: "QUALIFIED" } });
  const remaining = Math.max(target - alreadyQualified, 0);
  if (remaining === 0) {
    await markListReady(leadListId, organizationId, alreadyQualified, target, log);
    return;
  }

  const actor = ACTORS[plan.actorKey];
  await log(`Searching ${actor.leadType === "LOCAL" ? "Google Maps" : "the B2B database"} — ${plan.humanSummary}`, "tool");

  // One Apify call per round. Size the crawl to the remaining gap, rotate the
  // search window by round (so each call hits new places — the actor has no
  // exclude param), and push "no website"/rating filters to the actor natively.
  const { candidateTarget, scrapeContacts } = resolveCrawl({ ...plan, maxResults: remaining });
  const crawlPlan: ResolvedPlan = {
    ...plan,
    maxResults: candidateTarget,
    params: { ...plan.params, maxResults: candidateTarget, round },
    enrichments: { ...plan.enrichments, companyContacts: scrapeContacts },
  };
  const raw = await actor.run(apify, crawlPlan);
  const candidatesExamined = raw.length;
  await log(`Found ${candidatesExamined} candidates. Checking them against your conditions…`, "info");

  const fresh = await dedup(organizationId, raw);

  // Signal enrichment — run referenced probes only (website audit for now).
  const needsAudit = signalProvidersFor(plan.criteria).has("website-audit");
  let audited = 0;
  const withSignals: Array<{ lead: NormalizedLead; signals: LeadSignals }> = [];
  for (const lead of fresh) {
    const signals: LeadSignals = {};
    if (needsAudit) {
      signals.websiteAudit = await auditWebsite(lead.companyWebsite);
      audited++;
    }
    withSignals.push({ lead, signals });
  }

  // Hard criteria filter (attribute + signal tiers; judge tier handled in qualification).
  const passed = withSignals.filter(({ lead, signals }) => evaluateLead(lead, signals, plan.criteria).passedHard);
  await log(`${passed.length} of ${fresh.length} match your conditions.`, passed.length ? "success" : "info");

  // B2B email enrichment via Prospeo when the actor didn't return an email.
  let enriched = 0;
  if (plan.leadType === "B2B") {
    const prospeo = getProspeoClient();
    if (prospeo) {
      for (const { lead } of passed) {
        if (!lead.email && lead.firstName && lead.companyWebsite) {
          enriched++;
          const r = await prospeo.findEmail({
            firstName: lead.firstName,
            lastName: lead.lastName ?? undefined,
            domain: domainOf(lead.companyWebsite),
          });
          if (r.email) lead.email = r.email;
        }
      }
    }
  }

  // Keep only leads we can actually reach (email, phone, or LinkedIn) and cap to
  // the remaining gap — the top-up loop fetches another round if we're still short.
  const contactable = passed
    .filter(({ lead }) => lead.email || lead.phone || lead.linkedinUrl)
    .slice(0, remaining);

  const saved = await Promise.all(
    contactable.map(({ lead, signals }) =>
      prisma.lead.create({
        data: {
          leadListId,
          organizationId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          title: lead.title,
          companyName: lead.companyName,
          companyWebsite: lead.companyWebsite,
          companySize: lead.companySize,
          industry: lead.industry,
          city: lead.city,
          linkedinUrl: lead.linkedinUrl,
          whatsApp: lead.phone,
          source: lead.source,
          rawData: lead.rawData as never,
          signals: {
            websiteAudit: signals.websiteAudit ?? null,
            criteria: evaluateLead(lead, signals, plan.criteria),
          } as never,
          status: "RESEARCHING",
        },
      })
    )
  );

  // Accumulate COGS across rounds so the final reconcile charges for the whole loop.
  const prevMeta = (lr.costMeta ?? {}) as { candidatesExamined?: number; audited?: number; enriched?: number; savedLeads?: number };
  await prisma.leadRequest.update({
    where: { id: leadRequestId },
    data: {
      costMeta: {
        candidatesExamined: (prevMeta.candidatesExamined ?? 0) + candidatesExamined,
        audited: (prevMeta.audited ?? 0) + audited,
        enriched: (prevMeta.enriched ?? 0) + enriched,
        actorPerResultUsd: actor.perResultCostUsd(crawlPlan),
        savedLeads: (prevMeta.savedLeads ?? 0) + saved.length,
      } as never,
    },
  });
  await prisma.leadList.update({
    where: { id: leadListId },
    data: { totalLeads: alreadyQualified + saved.length, jobStatus: "researching_companies" },
  });

  if (saved.length === 0) {
    await log(`Round ${round}: no new matching leads in this area — trying another…`, "info");
    // Let the finalizer top up with another round/area, or finalize at the round cap.
    await finalizeOrTopUp(leadListId, organizationId, log);
    return;
  }

  const researchQueue = getLeadResearchQueue();
  await Promise.all(
    saved.map((l) =>
      researchQueue.add(
        "lead-research",
        { organizationId, leadListId, leadId: l.id },
        { jobId: `research-${l.id}` }
      )
    )
  );
  await log(`Saved ${saved.length} matching leads. Researching and writing outreach…`, "success");
}
