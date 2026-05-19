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
