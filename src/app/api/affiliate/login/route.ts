import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { createAccessToken } from "@/lib/affiliate";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const { email } = parsed.data;

  const affiliate = await prisma.affiliate.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!affiliate || affiliate.status !== "ACTIVE") {
    return NextResponse.json({ success: true });
  }

  const { token, expiresAt } = createAccessToken();

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { accessToken: token, accessTokenExpiresAt: expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  const magicLink = `${appUrl}/affiliate/auth?token=${token}`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Flowfiy Affiliates <affiliates@flowfiy.com>",
    to: [email],
    subject: "Your Flowfiy affiliate dashboard login link",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#09090f;color:#e4e4e7;border-radius:12px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
          <div style="width:36px;height:36px;background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#fff;">F</div>
          <span style="font-size:18px;font-weight:700;color:#fff;">Flowfiy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px;">Login to your affiliate dashboard</h2>
        <p style="color:#a1a1aa;margin:0 0 24px;">Click the button below to access your Flowfiy affiliate dashboard. This link expires in 30 days.</p>
        <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none;">Open Dashboard →</a>
        <p style="color:#52525b;font-size:12px;margin-top:28px;">If you didn't request this, you can safely ignore it.<br/>Link expires: ${expiresAt.toLocaleDateString("en-IN")}</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
