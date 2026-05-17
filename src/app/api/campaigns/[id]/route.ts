import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { enqueueEmailJob } from "@/workers/queues";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  gmailFromAddress: z.string().email().optional(),
  calendlyLink: z.string().url().optional(),
  dailySendLimit: z.number().min(1).max(200).optional(),
  followUp1DelayDays: z.number().min(1).max(30).optional(),
  followUp2DelayDays: z.number().min(1).max(60).optional(),
});

async function verifyCampaignAccess(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, organizationId: true, status: true },
  });
  if (!campaign) return null;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId } },
  });
  if (!member) return null;

  return campaign;
}

// ── GET /api/campaigns/[id] ──────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      campaignLeads: {
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              title: true,
              companyName: true,
            },
          },
          outreachCopy: {
            select: {
              subjectLine: true,
              body: true,
              followUp1: true,
              followUp2: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { campaignLeads: true } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: campaign.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ campaign });
}

// ── PATCH /api/campaigns/[id] ────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await verifyCampaignAccess(id, user.id);
  if (!campaign) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updated = await prisma.campaign.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ campaign: updated });
}

// ── POST /api/campaigns/[id]/leads  →  handled by [id]/leads/route.ts
// ── POST /api/campaigns/[id]/launch →  handled by [id]/launch/route.ts
