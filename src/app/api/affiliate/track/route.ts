import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    const affiliate = await prisma.affiliate.findFirst({
      where: { affiliateCode: code.toUpperCase(), status: "ACTIVE" },
      select: { id: true },
    });

    if (affiliate) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
      const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

      // Fire-and-forget — don't await, don't block response
      Promise.all([
        prisma.affiliateClick.create({
          data: { affiliateId: affiliate.id, ipHash },
        }),
        prisma.affiliate.update({
          where: { id: affiliate.id },
          data: { totalClicks: { increment: 1 } },
        }),
      ]).catch((err) => console.error("[affiliate/track]", err));
    }
  }

  return NextResponse.json({ ok: true });
}
