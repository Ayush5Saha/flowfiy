import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { generateAffiliateCode, createAccessToken } from "@/lib/affiliate";
import { createContact, createUPIFundAccount } from "@/lib/razorpay-x";

async function requireAdminOrUnauthorized() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token || !verifyAdminToken(token)) {
    return false;
  }
  return true;
}

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  upiId: z.string().min(3).max(100).regex(/^[\w.\-]+@[\w]+$/, "Invalid UPI ID format").optional(),
  commissionRate: z.number().min(0.01).max(0.5).default(0.1),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdminOrUnauthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, upiId, commissionRate } = parsed.data;

  // Reject duplicate email (Affiliate.email is unique)
  const existing = await prisma.affiliate.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A rep or affiliate with this email already exists." },
      { status: 409 }
    );
  }

  // Generate unique affiliate code (retry on collision)
  let affiliateCode = "";
  for (let i = 0; i < 5; i++) {
    const candidate = generateAffiliateCode();
    const taken = await prisma.affiliate.findUnique({ where: { affiliateCode: candidate } });
    if (!taken) { affiliateCode = candidate; break; }
  }
  if (!affiliateCode) {
    return NextResponse.json({ error: "Could not generate affiliate code. Please try again." }, { status: 500 });
  }

  const { token: accessToken, expiresAt: accessTokenExpiresAt } = createAccessToken();

  // If a UPI ID was supplied, wire up RazorpayX contact + fund account.
  // Gracefully fall back to saving just the UPI ID when Razorpay X is not configured.
  let razorpayContactId: string | null = null;
  let razorpayFundAccountId: string | null = null;
  if (upiId) {
    try {
      const contact = await createContact({ name, email });
      razorpayContactId = contact.id;
      const fundAccount = await createUPIFundAccount({ contactId: contact.id, upiId, name });
      razorpayFundAccountId = fundAccount.id;
    } catch (err) {
      console.error("[admin/sales-team]", err);
      // Razorpay X not configured yet — still save the UPI ID below.
    }
  }

  const rep = await prisma.affiliate.create({
    data: {
      name,
      email,
      phone: phone || null,
      type: "SALES_REP",
      status: "ACTIVE",
      commissionRate,
      affiliateCode,
      accessToken,
      accessTokenExpiresAt,
      ...(upiId ? { upiId } : {}),
      ...(razorpayContactId ? { razorpayContactId } : {}),
      ...(razorpayFundAccountId ? { razorpayFundAccountId } : {}),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  const refLink = `${appUrl}?ref=${affiliateCode}`;
  const dashboardLink = `${appUrl}/affiliate/auth?token=${accessToken}`;

  return NextResponse.json({
    success: true,
    rep: {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      affiliateCode: rep.affiliateCode,
      refLink,
      dashboardLink,
    },
  });
}

export async function GET(req: NextRequest) {
  if (!(await requireAdminOrUnauthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reps = await prisma.affiliate.findMany({
    where: { type: "SALES_REP" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
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
        where: { status: { in: ["PENDING", "APPROVED"] } },
        select: { commissionAmountInPaise: true },
      },
    },
  });

  const result = reps.map((r) => {
    const unpaidInPaise = r.conversions.reduce(
      (sum, c) => sum + c.commissionAmountInPaise,
      0n
    );
    return {
      ...r,
      totalEarningsInPaise: r.totalEarningsInPaise.toString(),
      totalPaidInPaise: r.totalPaidInPaise.toString(),
      unpaidInPaise: unpaidInPaise.toString(),
      conversions: undefined,
    };
  });

  return NextResponse.json({ reps: result });
}
