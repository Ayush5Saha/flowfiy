import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getRazorpay, PLANS } from "@/lib/razorpay";

const schema = z.object({ organizationId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    include: { organization: true },
  });

  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organization } = member;

  if (!organization.razorpaySubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });
  }

  // false = cancel at end of current billing cycle (not immediately)
  await getRazorpay().subscriptions.cancel(organization.razorpaySubscriptionId, false);

  await prisma.organization.update({
    where: { id: organizationId },
    data: { subscriptionStatus: "pending_cancellation" },
  });

  return NextResponse.json({ cancelled: true });
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
