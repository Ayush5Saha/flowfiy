import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createPayout } from "@/lib/razorpay-x";
import { MIN_PAYOUT_PAISE } from "@/lib/affiliate";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id },
    include: {
      conversions: {
        where: { status: "APPROVED" },
      },
    },
  });

  if (!affiliate) return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  if (!affiliate.razorpayFundAccountId) {
    return NextResponse.json({ error: "Affiliate has not added a UPI ID yet." }, { status: 400 });
  }

  const totalApproved = affiliate.conversions.reduce(
    (sum, c) => sum + c.commissionAmountInPaise,
    0n
  );

  if (totalApproved < MIN_PAYOUT_PAISE) {
    return NextResponse.json({
      error: `Minimum payout is ₹500. Current approved balance: ₹${Number(totalApproved) / 100}`,
    }, { status: 400 });
  }

  const accountNumber = process.env.RAZORPAY_X_ACCOUNT_NUMBER;
  if (!accountNumber) {
    return NextResponse.json({ error: "RAZORPAY_X_ACCOUNT_NUMBER not configured." }, { status: 500 });
  }

  const referenceId = `flowfiy-aff-${id}-${Date.now()}`;

  const payout = await createPayout({
    fundAccountId: affiliate.razorpayFundAccountId,
    amountInPaise: totalApproved,
    narration: "Flowfiy affiliate commission",
    referenceId,
    accountNumber,
  });

  // Mark all approved conversions as PAID
  await prisma.$transaction([
    prisma.affiliateConversion.updateMany({
      where: { affiliateId: id, status: "APPROVED" },
      data: { status: "PAID", payoutId: payout.id, paidAt: new Date() },
    }),
    prisma.affiliate.update({
      where: { id },
      data: { totalPaidInPaise: { increment: totalApproved } },
    }),
  ]);

  return NextResponse.json({
    success: true,
    payoutId: payout.id,
    amountPaid: Number(totalApproved) / 100,
  });
}
