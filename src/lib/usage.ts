import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<Plan, number> = {
  FREE:    100,
  INDIE:   2500,
  STARTER: 2500,
  GROWTH:  7500,
  AGENCY:  -1, // unlimited
};

export async function checkGenerationLimit(
  organizationId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true, generationCount: true, generationLimit: true },
  });

  // Derive the effective limit from PLAN_LIMITS so it always reflects current
  // plan pricing — fall back to the DB value for orgs with custom overrides.
  const planLimit = PLAN_LIMITS[org.plan];
  const limit = planLimit !== undefined ? planLimit : org.generationLimit;
  const count = org.generationCount;

  if (limit === -1) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const remaining = Math.max(0, limit - count);
  return { allowed: remaining > 0, remaining, limit };
}

/**
 * Atomically checks the generation limit AND increments the counter in a
 * single serializable transaction — prevents race conditions where multiple
 * concurrent requests all pass the limit check before any increment runs.
 *
 * Call this at enqueue time instead of the check+increment split.
 * The worker should NOT call incrementGenerationCount separately for runs
 * reserved through this function.
 */
export async function reserveGenerationQuota(
  organizationId: string,
  amount: number
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  return prisma.$transaction(
    async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { plan: true, generationCount: true, generationLimit: true },
      });

      const planLimit = PLAN_LIMITS[org.plan];
      const limit = planLimit !== undefined ? planLimit : org.generationLimit;

      // Unlimited plans — increment freely
      if (limit === -1) {
        await tx.organization.update({
          where: { id: organizationId },
          data: { generationCount: { increment: amount } },
        });
        return { allowed: true, remaining: -1, limit: -1 };
      }

      // Limit check — reject if already at or over limit
      if (org.generationCount >= limit) {
        return { allowed: false, remaining: 0, limit };
      }

      // Reserve the slot atomically
      await tx.organization.update({
        where: { id: organizationId },
        data: { generationCount: { increment: amount } },
      });

      const remaining = Math.max(0, limit - org.generationCount - amount);
      return { allowed: true, remaining, limit };
    },
    { isolationLevel: "Serializable" }
  );
}

export async function incrementGenerationCount(
  organizationId: string,
  amount = 1
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { generationCount: { increment: amount } },
  });

  await prisma.usageEvent.create({
    data: {
      organizationId,
      eventType: "lead_generation",
      metadata: { amount },
    },
  });
}

// ─── Token Budget (secondary safety gate for central API cost control) ────────

export const PLAN_TOKEN_BUDGETS: Record<Plan, number> = {
  FREE:    0,          // BYOK only — no central tokens
  INDIE:   0,          // BYOK only — no central tokens
  STARTER: 6_000_000,
  GROWTH:  20_000_000,
  AGENCY:  -1,         // unlimited
};

export async function checkTokenBudget(
  organizationId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true, monthlyTokensUsed: true, tokenBudgetResetAt: true },
  });

  const budget = PLAN_TOKEN_BUDGETS[org.plan];

  // BYOK-only plans have no central token budget to check
  if (budget === 0) return { allowed: true, remaining: 0 };
  if (budget === -1) return { allowed: true, remaining: -1 };

  // Auto-reset if we're in a new calendar month
  const now = new Date();
  const resetNeeded =
    !org.tokenBudgetResetAt ||
    org.tokenBudgetResetAt.getMonth() !== now.getMonth() ||
    org.tokenBudgetResetAt.getFullYear() !== now.getFullYear();

  if (resetNeeded) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { monthlyTokensUsed: 0, tokenBudgetResetAt: now },
    });
    return { allowed: true, remaining: budget };
  }

  const used = Number(org.monthlyTokensUsed);
  const remaining = Math.max(0, budget - used);
  return { allowed: remaining > 0, remaining };
}

export async function incrementTokenUsage(
  organizationId: string,
  tokens: number
): Promise<void> {
  await prisma.organization.update({
    where: { id: organizationId },
    data: { monthlyTokensUsed: { increment: tokens } },
  });
}
