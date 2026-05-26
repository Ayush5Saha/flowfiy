import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { createAccessToken } from "@/lib/affiliate";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  commissionRate: z.number().min(0.01).max(0.9).optional(),
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

  const { status, commissionRate } = parsed.data;

  const affiliate = await prisma.affiliate.findUnique({ where: { id } });
  if (!affiliate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const wasApproved = affiliate.status !== "ACTIVE" && status === "ACTIVE";

  // Generate access token when approving
  let tokenData: { accessToken: string; accessTokenExpiresAt: Date } | undefined;
  if (wasApproved) {
    const { token: newToken, expiresAt } = createAccessToken();
    tokenData = { accessToken: newToken, accessTokenExpiresAt: expiresAt };
  }

  const updated = await prisma.affiliate.update({
    where: { id },
    data: {
      status,
      ...(commissionRate !== undefined ? { commissionRate } : {}),
      ...(tokenData ?? {}),
    },
  });

  // Send approval email with magic link
  if (wasApproved && tokenData) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
    const magicLink = `${appUrl}/affiliate/auth?token=${tokenData.accessToken}`;
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "Flowfiy Affiliates <affiliates@flowfiy.com>",
      to: [updated.email],
      subject: "You're approved! Your Flowfiy affiliate link is ready 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#09090f;color:#e4e4e7;border-radius:12px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff;">F</div>
            <span style="font-size:18px;font-weight:700;color:#fff;">Flowfiy</span>
          </div>
          <h2 style="color:#fff;margin:0 0 8px;">Welcome to the Flowfiy Affiliate Program!</h2>
          <p style="color:#a1a1aa;margin:0 0 8px;">Hi ${updated.name}, your application has been approved. 🎉</p>
          <p style="color:#a1a1aa;margin:0 0 24px;">You'll earn <strong style="color:#a78bfa;">${Math.round(updated.commissionRate * 100)}% commission</strong> on every payment from customers you refer — recurring, every month.</p>

          <div style="background:#18181b;border:1px solid #27272a;border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="color:#a1a1aa;font-size:13px;margin:0 0 6px;">Your unique affiliate link</p>
            <p style="color:#a78bfa;font-family:monospace;font-size:15px;margin:0;word-break:break-all;">https://flowfiy.com?ref=${updated.affiliateCode}</p>
          </div>

          <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Open Your Dashboard →</a>

          <hr style="border:none;border-top:1px solid #27272a;margin:24px 0;" />
          <h3 style="color:#fff;font-size:14px;margin:0 0 8px;">How payouts work</h3>
          <ul style="color:#a1a1aa;font-size:13px;padding-left:20px;margin:0;">
            <li style="margin-bottom:4px;">Commissions are tracked automatically on every payment</li>
            <li style="margin-bottom:4px;">Payouts processed monthly via UPI (minimum ₹500)</li>
            <li style="margin-bottom:4px;">Add your UPI ID in your dashboard to receive payments</li>
          </ul>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true, status: updated.status });
}
