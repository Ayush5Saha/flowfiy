/**
 * Reconcile a finished NL run's credits.
 *
 * The customer is billed PURELY on qualified leads DELIVERED, at the published
 * rate (≈2 leads per credit) — never for candidates examined or for research
 * spend. The charge is clamped to the reserved hold and the remainder released;
 * an empty run (0 qualified) charges nothing.
 *
 * True COGS (actor + website audits + Prospeo + Gemini) is still computed and
 * stamped onto the CONSUME ledger row as `costUsd`, but only for internal margin
 * tracking — it is not what the wallet pays.
 */
import { prisma } from "@/lib/prisma";
import { reconcileRun, releaseHold } from "@/lib/credits/service";
import {
  creditsForQualifiedLeads,
  WEBSITE_AUDIT_COST_USD,
  GEMINI_PER_LEAD_USD,
  ENRICH_RATES,
} from "@/lib/credits/rates";

interface CostMeta {
  candidatesExamined?: number;
  audited?: number;
  enriched?: number;
  actorPerResultUsd?: number;   // legacy per-round snapshot (pre-actorCostUsd rows)
  actorCostUsd?: number;        // actor COGS summed in USD across rounds
  savedLeads?: number;
}

/** Idempotent — safe to call from any finalizer. No-op for non-NL lists. */
export async function reconcileLeadRequest(leadListId: string, organizationId: string): Promise<void> {
  const lr = await prisma.leadRequest.findUnique({ where: { leadListId } });
  if (!lr) return;                       // not an NL run
  if (lr.actualCredits !== null) return; // already reconciled

  const held = lr.heldCredits ?? 0;

  // ── What the customer pays: qualified leads DELIVERED ÷ leads-per-credit ──
  const qualified = await prisma.lead.count({ where: { leadListId, status: "QUALIFIED" } });
  const charge = creditsForQualifiedLeads(qualified);

  // ── True COGS — recorded for internal margin tracking only ───────────────
  // Actor cost is summed in USD per round (`actorCostUsd`); fall back to the
  // legacy single-rate snapshot for rows written before that field existed.
  const meta = (lr.costMeta ?? {}) as CostMeta;
  const actorCostUsd =
    meta.actorCostUsd ?? (meta.candidatesExamined ?? 0) * (meta.actorPerResultUsd ?? 0);
  const totalCostUsd =
    actorCostUsd +
    (meta.audited ?? 0) * WEBSITE_AUDIT_COST_USD +
    (meta.enriched ?? 0) * ENRICH_RATES.prospeo +
    (meta.savedLeads ?? 0) * GEMINI_PER_LEAD_USD;

  const { consumed } = await reconcileRun(organizationId, {
    reservedCredits: held,
    chargeCredits: charge,
    costUsd: totalCostUsd,
    ref: { refType: "lead_request", refId: lr.id },
  });

  // Count DELIVERED qualified leads against the no-subscription trial allowance —
  // only while the org is unsubscribed (subscribers are metered by credits alone).
  if (qualified > 0) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true, subscriptionStatus: true },
    });
    const subscribed = !!org && org.plan !== "FREE" && org.subscriptionStatus === "active";
    if (!subscribed) {
      await prisma.organization
        .update({ where: { id: organizationId }, data: { trialLeadsUsed: { increment: qualified } } })
        .catch(() => null);
    }
  }

  await prisma.leadRequest.update({
    where: { id: lr.id },
    data: { status: "READY_FOR_REVIEW", actualCredits: consumed },
  });
}

/** Release the full hold without charging (failed / cancelled run). Idempotent. */
export async function releaseLeadRequestHold(
  leadRequestId: string,
  organizationId: string,
  status: "FAILED" | "CANCELLED",
  error?: string
): Promise<void> {
  const lr = await prisma.leadRequest.findUnique({ where: { id: leadRequestId } });
  if (!lr || lr.actualCredits !== null) return;
  const held = lr.heldCredits ?? 0;
  if (held > 0) {
    await releaseHold(organizationId, held, { refType: "lead_request", refId: lr.id });
  }
  await prisma.leadRequest.update({
    where: { id: lr.id },
    data: { status, error: error ?? lr.error, actualCredits: 0 },
  });
}
