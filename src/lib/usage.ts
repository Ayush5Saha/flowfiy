import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<Plan, number> = {
  FREE: 50,
  STARTER: 500,
  GROWTH: 2000,
  AGENCY: -1, // unlimited
};

export async function checkGenerationLimit(
  organizationId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { plan: true, generationCount: true, generationLimit: true },
  });

  const limit = org.generationLimit;
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
