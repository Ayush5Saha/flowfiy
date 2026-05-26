import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AFFILIATE_SESSION_COOKIE } from "@/lib/affiliate";
import { createContact, createUPIFundAccount } from "@/lib/razorpay-x";

const schema = z.object({
  upiId: z.string().min(3).max(100).regex(/^[\w.\-]+@[\w]+$/, "Invalid UPI ID format"),
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AFFILIATE_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const affiliate = await prisma.affiliate.findFirst({
    where: { accessToken: token, accessTokenExpiresAt: { gt: new Date() }, status: "ACTIVE" },
  });
  if (!affiliate) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { upiId } = parsed.data;

  try {
    // Create Razorpay X contact if not exists
    let contactId = affiliate.razorpayContactId;
    if (!contactId) {
      const contact = await createContact({ name: affiliate.name, email: affiliate.email });
      contactId = contact.id;
    }

    // Create fund account for UPI
    const fundAccount = await createUPIFundAccount({
      contactId,
      upiId,
      name: affiliate.name,
    });

    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        upiId,
        razorpayContactId: contactId,
        razorpayFundAccountId: fundAccount.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[affiliate/payment-details]", err);
    // If Razorpay X is not configured, just save the UPI ID
    await prisma.affiliate.update({
      where: { id: affiliate.id },
      data: { upiId },
    });
    return NextResponse.json({ success: true, warning: "UPI saved. Razorpay X not configured yet." });
  }
}
