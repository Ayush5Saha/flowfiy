import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

async function requireAdminOrUnauthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminOrUnauthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      website: true,
      socialHandle: true,
      audienceDescription: true,
      affiliateCode: true,
      commissionRate: true,
      status: true,
      totalClicks: true,
      totalSignups: true,
      totalEarningsInPaise: true,
      totalPaidInPaise: true,
      upiId: true,
      razorpayFundAccountId: true,
      createdAt: true,
      conversions: {
        where: { status: "APPROVED" },
        select: { commissionAmountInPaise: true },
      },
    },
  });

  const result = affiliates.map((a) => {
    const unpaidApproved = a.conversions.reduce(
      (sum, c) => sum + c.commissionAmountInPaise,
      0n
    );
    return {
      ...a,
      totalEarningsInPaise: a.totalEarningsInPaise.toString(),
      totalPaidInPaise: a.totalPaidInPaise.toString(),
      unpaidApprovedInPaise: unpaidApproved.toString(),
    };
  });

  return NextResponse.json({ affiliates: result });
}
