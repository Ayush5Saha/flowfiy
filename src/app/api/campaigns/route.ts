import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
  leadListId: z.string().uuid().optional(),
  gmailFromAddress: z.string().email().optional(),
  calendlyLink: z.string().url().optional(),
  dailySendLimit: z.number().min(1).max(200).default(50),
  followUp1DelayDays: z.number().min(1).max(30).default(3),
  followUp2DelayDays: z.number().min(1).max(60).default(7),
});

// ── GET /api/campaigns?organizationId=xxx ────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId },
    include: {
      _count: { select: { campaignLeads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

// ── POST /api/campaigns ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { organizationId, ...data } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Email-address pre-check: a campaign on a lead list that has zero qualified
  // leads with an email can never send anything. Block it up front with a clear
  // message instead of letting the user create an undeliverable campaign.
  if (data.leadListId) {
    const emailableCount = await prisma.lead.count({
      where: {
        leadListId: data.leadListId,
        organizationId,
        status: "QUALIFIED",
        email: { not: null },
        NOT: { email: "" },
      },
    });
    if (emailableCount === 0) {
      return NextResponse.json(
        {
          error: "no_emailable_leads",
          message:
            "This lead list has no leads with an email address, so a campaign can't email anyone. " +
            "Pick a list that has emails, or enrich these leads first (these are usually reachable via WhatsApp/phone instead).",
        },
        { status: 422 }
      );
    }
  }

  const campaign = await prisma.campaign.create({
    data: { organizationId, ...data },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
