import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/track/open?id={campaignLeadId}
 *
 * Public endpoint — no auth required (called by email client when rendering).
 * Returns a 1×1 transparent GIF and records the open event.
 *
 * Security notes:
 * - No sensitive data is exposed — just an ID increment
 * - Bot/prefetch opens are expected; openCount accumulates all renders
 * - openedAt is only set on the FIRST open so it reflects when a human
 *   actually read the email, not subsequent re-reads
 */

// 1×1 transparent GIF (35 bytes)
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    // Fire-and-forget — don't delay the image response for DB latency
    recordOpen(id).catch(() => null);
  }

  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      // Tell all caches (CDN, email clients, proxies) never to cache this
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function recordOpen(campaignLeadId: string): Promise<void> {
  const cl = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
    select: { status: true, openedAt: true },
  });
  if (!cl) return;

  // Don't downgrade a REPLIED or UNSUBSCRIBED status — just count the open
  const shouldUpgradeStatus =
    cl.status === "SENT" || cl.status === "PENDING";

  await prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: {
      openCount: { increment: 1 },
      // Only set openedAt once (first open) and only upgrade status if not already terminal
      ...(cl.openedAt === null && { openedAt: new Date() }),
      ...(shouldUpgradeStatus && { status: "OPENED" }),
    },
  });
}
