import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { PLANS, getPlanByRazorpayPlanId } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as {
    event: string;
    payload: {
      subscription?: { entity: Record<string, unknown> };
      payment?: { entity: Record<string, unknown> };
    };
  };

  const sub = event.payload.subscription?.entity;

  switch (event.event) {
    case "subscription.activated": {
      if (!sub) break;
      const notes = sub.notes as Record<string, string> | undefined;
      const organizationId = notes?.organizationId;
      const planKey = notes?.planKey as keyof typeof PLANS | undefined;

      if (organizationId && planKey && PLANS[planKey]) {
        const planConfig = PLANS[planKey];
        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: planKey as never,
            razorpaySubscriptionId: sub.id as string,
            subscriptionStatus: "active",
            generationLimit: planConfig.generationLimit,
          },
        });
      }
      break;
    }

    case "subscription.charged": {
      if (!sub) break;
      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: sub.id as string },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: "active" },
        });
      }
      break;
    }

    case "subscription.cancelled": {
      if (!sub) break;
      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: sub.id as string },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: {
            plan: "FREE",
            razorpaySubscriptionId: null,
            subscriptionStatus: "cancelled",
            generationLimit: PLANS.FREE.generationLimit,
          },
        });
      }
      break;
    }

    case "subscription.halted": {
      if (!sub) break;
      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: sub.id as string },
      });
      if (org) {
        await prisma.organization.update({
          where: { id: org.id },
          data: { subscriptionStatus: "halted" },
        });
      }
      break;
    }

    case "subscription.updated": {
      if (!sub) break;
      const planId = sub.plan_id as string | undefined;
      const org = await prisma.organization.findFirst({
        where: { razorpaySubscriptionId: sub.id as string },
      });
      if (org && planId) {
        const newPlanKey = getPlanByRazorpayPlanId(planId);
        if (newPlanKey && PLANS[newPlanKey]) {
          await prisma.organization.update({
            where: { id: org.id },
            data: {
              plan: newPlanKey as never,
              generationLimit: PLANS[newPlanKey].generationLimit,
            },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
