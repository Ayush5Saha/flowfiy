import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createContact, createUPIFundAccount } from "@/lib/razorpay-x";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  commissionRate: z.number().min(0.01).max(0.5).optional(),
  phone: z.string().max(30).optional(),
  upiId: z.string().min(3).max(100).regex(/^[\w.\-]+@[\w]+$/, "Invalid UPI ID format").optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { status, commissionRate, phone, upiId } = parsed.data;

  const rep = await prisma.affiliate.findUnique({ where: { id } });
  if (!rep || rep.type !== "SALES_REP") {
    return NextResponse.json({ error: "Sales rep not found" }, { status: 404 });
  }

  // If the UPI ID changes, recreate the RazorpayX contact + fund account.
  // Gracefully fall back to saving just the UPI ID when Razorpay X is not configured.
  let razorpayContactId: string | null | undefined;
  let razorpayFundAccountId: string | null | undefined;
  if (upiId !== undefined && upiId !== rep.upiId) {
    try {
      let contactId = rep.razorpayContactId;
      if (!contactId) {
        const contact = await createContact({ name: rep.name, email: rep.email });
        contactId = contact.id;
      }
      const fundAccount = await createUPIFundAccount({ contactId, upiId, name: rep.name });
      razorpayContactId = contactId;
      razorpayFundAccountId = fundAccount.id;
    } catch (err) {
      console.error("[admin/sales-team]", err);
      // Razorpay X not configured yet — still save the UPI ID below.
    }
  }

  await prisma.affiliate.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(commissionRate !== undefined ? { commissionRate } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(upiId !== undefined ? { upiId } : {}),
      ...(razorpayContactId !== undefined ? { razorpayContactId } : {}),
      ...(razorpayFundAccountId !== undefined ? { razorpayFundAccountId } : {}),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const rep = await prisma.affiliate.findUnique({
    where: { id },
    include: { _count: { select: { conversions: true } } },
  });
  if (!rep || rep.type !== "SALES_REP") {
    return NextResponse.json({ error: "Sales rep not found" }, { status: 404 });
  }

  // Commission history is a money record — never hard-delete it. Suspension
  // keeps the row (and payout audit trail) while cutting the rep off.
  if (rep._count.conversions > 0) {
    return NextResponse.json(
      { error: `${rep.name} has commission history and can't be deleted. Suspend them instead — their link stops earning but the payout records stay intact.` },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    // Un-attribute any org that clicked their link but never paid, so the
    // billing webhooks never look up a deleted affiliate id.
    prisma.organization.updateMany({
      where: { referredByAffiliateId: id },
      data: { referredByAffiliateId: null },
    }),
    prisma.affiliateClick.deleteMany({ where: { affiliateId: id } }),
    prisma.affiliate.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
