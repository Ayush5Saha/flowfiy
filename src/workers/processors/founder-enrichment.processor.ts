/**
 * Queue: lead-founder-enrichment (ON-DEMAND — not part of the automatic pipeline)
 *
 * Triggered only by the leads-page buttons (per-lead or bulk) via
 * POST /api/leads/[listId]/enrich-founders. For one QUALIFIED-ish lead it:
 *   1. Finds the company's founder on LinkedIn (Apify harvestapi actor)
 *   2. Deterministically matches a profile to the lead (company + title)
 *   3. Picks the best deliverable email off that profile
 *   4. Swaps the founder's name + verified email into the Lead (the campaign then
 *      sends to the founder, not the scraped website info@ address)
 *
 * Billing: the customer is charged FOUNDER_CREDITS_PER_LEAD credits ONLY when a
 * founder email is actually found and saved — a miss/error costs them nothing
 * (matches Flowfiy's "you only pay for what's delivered" contract). The credit
 * price is locked into the job at enqueue time.
 *
 * Runs at concurrency=5 (each job holds one Apify actor run).
 * Idempotent: a lead that already carries researchMetadata.founderEnrichment is
 * skipped without spending anything.
 */
import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { appendLog } from "@/lib/job-logs";
import { getPlatformApifyClient } from "@/integrations/apify";
import { reserveCredits, reconcileRun } from "@/lib/credits/service";
import {
  FOUNDER_ENRICHMENT_ACTOR_ID,
  founderEnrichmentEnabled,
  buildFounderSearchInput,
  parseFounderProfile,
  matchFounderToLead,
  pickBestEmail,
  founderRunCostUsd,
  type FounderProfile,
} from "@/integrations/linkedin-founder";
import {
  isFounderEnrichmentEligible,
  founderEnrichmentAttempted,
  type FounderEnrichmentRecord,
} from "@/lib/founder-enrichment";
import { FOUNDER_CREDITS_PER_LEAD } from "@/lib/credits/rates";

export interface FounderEnrichmentJobData {
  organizationId: string;
  leadListId: string;
  leadId: string;
  /** Credit price locked at enqueue time so a later constant change can't
   *  retroactively re-price an in-flight batch. Falls back to the current rate. */
  creditsPerLead?: number;
}

export async function processFounderEnrichment(job: Job<FounderEnrichmentJobData>) {
  const { organizationId, leadListId, leadId } = job.data;
  const creditsPerLead = job.data.creditsPerLead ?? FOUNDER_CREDITS_PER_LEAD;

  const log = (msg: string, level: "info" | "success" | "error" | "tool" = "info") =>
    appendLog(leadListId, msg, level);

  const nowIso = () => new Date().toISOString();

  /** Read-modify-write researchMetadata.founderEnrichment, preserving other keys.
   *  Never throws — metadata is telemetry, not correctness. */
  const recordEnrichment = async (record: FounderEnrichmentRecord) => {
    const existing = await prisma.leadResearch
      .findUnique({ where: { leadId }, select: { researchMetadata: true } })
      .catch(() => null);
    const merged = {
      ...((existing?.researchMetadata as Record<string, unknown> | null) ?? {}),
      founderEnrichment: record,
    };
    await prisma.leadResearch
      .update({ where: { leadId }, data: { researchMetadata: merged as never } })
      .catch(() =>
        prisma.leadResearch
          .upsert({
            where: { leadId },
            update: { researchMetadata: merged as never },
            create: {
              leadId,
              organizationId,
              companyAnalysis: {} as never,
              researchMetadata: merged as never,
            },
          })
          .catch(() => null)
      );
  };

  // ── Load lead + its research (for the eligibility guard) ──────────────────
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      organizationId: true,
      firstName: true,
      lastName: true,
      title: true,
      email: true,
      companyName: true,
      city: true,
      linkedinUrl: true,
      rawData: true,
      status: true,
      research: { select: { researchMetadata: true } },
    },
  });

  if (!lead) return; // deleted — nothing to do
  if (lead.organizationId !== organizationId) {
    throw new Error(`Lead ${leadId} access denied.`);
  }

  // ── Idempotency + eligibility guards (never spend a credit here) ───────────
  if (founderEnrichmentAttempted(lead)) return; // already attempted in a prior run
  if (!founderEnrichmentEnabled()) {
    await recordEnrichment({ outcome: "disabled", at: nowIso() });
    return;
  }
  if (!isFounderEnrichmentEligible(lead)) {
    // No company, or it already has a decision-maker email — record why, no charge.
    const outcome = (lead.companyName ?? "").trim() ? "skipped_has_contact" : "skipped_no_company";
    await recordEnrichment({ outcome, at: nowIso() });
    return;
  }

  const client = getPlatformApifyClient();
  if (!client) {
    await recordEnrichment({ outcome: "disabled", at: nowIso() });
    return;
  }

  const companyName = (lead.companyName ?? "").trim();
  const currentEmail = (lead.email ?? "").trim();

  // ── Run the actor ─────────────────────────────────────────────────────────
  await log(`🔎 Finding the founder of ${companyName} on LinkedIn…`, "tool");

  let items: Record<string, unknown>[];
  try {
    items = await client.runActor(
      FOUNDER_ENRICHMENT_ACTOR_ID,
      buildFounderSearchInput({ companyName, city: lead.city, linkedinUrl: lead.linkedinUrl }),
      { maxItems: 3, maxTotalChargeUsd: 0.5, timeoutMs: 300_000 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const maxAttempts = job.opts.attempts ?? 3;
    if ((job.attemptsMade ?? 0) < maxAttempts - 1) {
      // Transient — let BullMQ retry. Nothing was charged (we bill only on found).
      await log(`⚠️ Founder lookup failed for ${companyName} (will retry): ${msg}`, "error");
      throw err;
    }
    await log(
      `⚠️ Founder lookup failed for ${companyName} after ${maxAttempts} tries — no charge.`,
      "error"
    );
    await recordEnrichment({ outcome: "error", profilesScraped: 0, at: nowIso() });
    return;
  }

  const costUsd = founderRunCostUsd(items.length);

  // ── Parse → match → outcome ───────────────────────────────────────────────
  // The parser/matcher are defensive (never throw), but guard anyway so an
  // unexpected shape records "error" WITHOUT rethrowing — the actor already ran,
  // a retry would just re-spend Apify budget.
  try {
    const at = nowIso();
    const profiles: FounderProfile[] = items.map(parseFounderProfile);
    const match = matchFounderToLead(profiles, { companyName, city: lead.city });

    if (!match) {
      await log(`ℹ️ No LinkedIn founder match for ${companyName} — no charge.`, "info");
      await recordEnrichment({ outcome: "no_match", profilesScraped: items.length, costUsd, at });
      return;
    }

    const founderName = `${match.firstName} ${match.lastName}`.trim() || match.firstName || "Founder";
    const best = pickBestEmail(match);

    if (!best) {
      await log(
        `ℹ️ Found ${founderName} (${match.title}) at ${companyName} but no deliverable email — no charge.`,
        "info"
      );
      await recordEnrichment({
        outcome: "no_email",
        founderName,
        founderTitle: match.title,
        founderLinkedinUrl: match.linkedinUrl,
        profilesScraped: items.length,
        costUsd,
        at,
      });
      return;
    }

    // ── Charge on found: reserve then immediately consume the locked price ──
    // Gate the spend atomically. If the wallet can't cover it (balance drained
    // since the user confirmed), skip WITHOUT saving so we never give the email
    // away unpaid; the user can top up and retry.
    const reservation = await reserveCredits(organizationId, creditsPerLead, {
      refType: "founder_enrichment",
      refId: leadId,
      metadata: { leadListId, founderName, email: best.email },
    });
    if (!reservation.ok) {
      await log(
        `⚠️ Found ${founderName} at ${companyName} but your credit balance was too low to save it — top up and try again.`,
        "error"
      );
      await recordEnrichment({
        outcome: "skipped_insufficient_credits",
        founderName,
        founderTitle: match.title,
        founderLinkedinUrl: match.linkedinUrl,
        profilesScraped: items.length,
        costUsd,
        at,
      });
      return;
    }

    // Save the founder's contact into the Lead. The old website email is kept in
    // rawData.websiteEmail; the campaign send worker reads lead.email, so this is
    // what prioritizes the founder email for outreach.
    const prevRawData = (lead.rawData as Record<string, unknown> | null) ?? {};
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          firstName: match.firstName || lead.firstName,
          lastName: match.lastName || lead.lastName,
          title: match.title || lead.title,
          email: best.email,
          linkedinUrl: match.linkedinUrl || lead.linkedinUrl,
          rawData: {
            ...prevRawData,
            websiteEmail: currentEmail || null,
            founderEnrichment: {
              source: FOUNDER_ENRICHMENT_ACTOR_ID,
              emailStatus: best.status,
              qualityScore: best.qualityScore,
              enrichedAt: at,
            },
          } as never,
        },
      });
    } catch (saveErr) {
      // Couldn't persist — release the hold so the user isn't charged for nothing.
      await reconcileRun(organizationId, {
        reservedCredits: creditsPerLead,
        chargeCredits: 0,
        costUsd: 0,
        ref: { refType: "founder_enrichment", refId: leadId },
      }).catch(() => null);
      throw saveErr;
    }

    // Saved — charge the locked price (consume the whole reservation).
    await reconcileRun(organizationId, {
      reservedCredits: creditsPerLead,
      chargeCredits: creditsPerLead,
      costUsd,
      ref: { refType: "founder_enrichment", refId: leadId, metadata: { leadListId } },
    }).catch(() => null);

    await log(
      `🎯 Founder found for ${companyName}: ${founderName} (${match.title}) — ${best.email} · ${creditsPerLead} credits`,
      "success"
    );
    await recordEnrichment({
      outcome: "found",
      founderName,
      founderTitle: match.title,
      founderLinkedinUrl: match.linkedinUrl,
      emailStatus: best.status,
      qualityScore: best.qualityScore,
      profilesScraped: items.length,
      costUsd,
      creditsCharged: creditsPerLead,
      at,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await log(
      `⚠️ Could not process founder results for ${companyName} (${msg.slice(0, 80)}) — no charge.`,
      "error"
    );
    await recordEnrichment({ outcome: "error", profilesScraped: items.length, costUsd, at: nowIso() });
  }
}
