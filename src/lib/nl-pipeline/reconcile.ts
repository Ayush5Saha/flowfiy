/**
 * Reconcile a finished NL run's credits from actual COGS.
 *
 * Total run COGS = actor cost (× candidates examined) + website audits + Prospeo
 * enrichment + Gemini per researched lead. Reconciled against the reserved hold:
 * charge actual (clamped to the hold), release the rest. Empty runs charge nothing.
 */
import { prisma } from "@/lib/prisma";
import { reconcileRun, releaseHold } from "@/lib/credits/service";
import { WEBSITE_AUDIT_COST_USD, GEMINI_PER_LEAD_USD, ENRICH_RATES } from "@/lib/credits/rates";

interface CostMeta {
  candidatesExamined?: number;
  audited?: number;
  enriched?: number;
  actorPerResultUsd?: number;
  savedLeads?: number;
}

/** Idempotent — safe to call from any finalizer. No-op for non-NL lists. */
export async function reconcileLeadRequest(leadListId: string, organizationId: string): Promise<void> {
  const lr = await prisma.leadRequest.findUnique({ where: { leadListId } });
  if (!lr) return;                       // not an NL run
  if (lr.actualCredits !== null) return; // already reconciled

  const held = lr.heldCredits ?? 0;
  const meta = (lr.costMeta ?? {}) as CostMeta;
  const totalCostUsd =
    (meta.candidatesExamined ?? 0) * (meta.actorPerResultUsd ?? 0) +
    (meta.audited ?? 0) * WEBSITE_AUDIT_COST_USD +
    (meta.enriched ?? 0) * ENRICH_RATES.prospeo +
    (meta.savedLeads ?? 0) * GEMINI_PER_LEAD_USD;

  const { consumed } = await reconcileRun(organizationId, {
    reservedCredits: held,
    totalCostUsd,
    ref: { refType: "lead_request", refId: lr.id },
  });

  // Count delivered leads against the no-subscription trial allowance — only
  // while the org is unsubscribed (subscribers are metered by credits alone).
  const savedLeads = meta.savedLeads ?? 0;
  if (savedLeads > 0) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { plan: true, subscriptionStatus: true },
    });
    const subscribed = !!org && org.plan !== "FREE" && org.subscriptionStatus === "active";
    if (!subscribed) {
      await prisma.organization
        .update({ where: { id: organizationId }, data: { trialLeadsUsed: { increment: savedLeads } } })
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
