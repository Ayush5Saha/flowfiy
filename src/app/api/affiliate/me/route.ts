import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AFFILIATE_SESSION_COOKIE } from "@/lib/affiliate";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AFFILIATE_SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliate = await prisma.affiliate.findFirst({
    where: {
      accessToken: token,
      accessTokenExpiresAt: { gt: new Date() },
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      affiliateCode: true,
      commissionRate: true,
      totalClicks: true,
      totalSignups: true,
      totalEarningsInPaise: true,
      totalPaidInPaise: true,
      upiId: true,
      razorpayFundAccountId: true,
      createdAt: true,
      conversions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          plan: true,
          paymentAmountInPaise: true,
          commissionAmountInPaise: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
  }

  const unpaidEarnings =
    affiliate.totalEarningsInPaise - affiliate.totalPaidInPaise;

  return NextResponse.json({
    affiliate: {
      ...affiliate,
      totalEarningsInPaise: affiliate.totalEarningsInPaise.toString(),
      totalPaidInPaise: affiliate.totalPaidInPaise.toString(),
      unpaidEarningsInPaise: unpaidEarnings.toString(),
      conversions: affiliate.conversions.map((c) => ({
        ...c,
        paymentAmountInPaise: c.paymentAmountInPaise.toString(),
        commissionAmountInPaise: c.commissionAmountInPaise.toString(),
      })),
    },
  });
}
