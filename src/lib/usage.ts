import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<Plan, number> = {
  FREE: 100,
  STARTER: 2500,
  GROWTH: 7500,
  AGENCY: -1, // unlimited
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
  FREE:    500_000,
  STARTER: 6_000_000,
  GROWTH:  20_000_000,
  AGENCY:  -1, // unlimited
};

export async function checkTokenBudget(
  organizationId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true, monthlyTokensUsed: true, tokenBudgetResetAt: true },
  });

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
    return { allowed: true, remaining: PLAN_TOKEN_BUDGETS[org.plan] };
  }

  const budget = PLAN_TOKEN_BUDGETS[org.plan];
  if (budget === -1) return { allowed: true, remaining: -1 };

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
