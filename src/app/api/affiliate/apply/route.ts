import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAffiliateCode } from "@/lib/affiliate";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal("")),
  socialHandle: z.string().max(100).optional(),
  audienceDescription: z.string().min(20).max(1000),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, website, socialHandle, audienceDescription } = parsed.data;

  // Check for existing application
  const existing = await prisma.affiliate.findUnique({ where: { email } });
  if (existing) {
    if (existing.status === "SUSPENDED") {
      return NextResponse.json(
        { error: "This email is not eligible for the affiliate program." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "An application with this email already exists.", status: existing.status },
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

  await prisma.affiliate.create({
    data: {
      name,
      email,
      website: website || null,
      socialHandle: socialHandle || null,
      audienceDescription,
      affiliateCode,
    },
  });

  return NextResponse.json({ success: true, message: "Application submitted! We'll review it within 48 hours and email you." });
}
