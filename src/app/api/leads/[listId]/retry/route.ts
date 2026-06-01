import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLeadDiscoveryQueue } from "@/workers/queues";

const schema = z.object({ organizationId: z.string().uuid() });

// POST /api/leads/[listId]/retry
// Re-queues a FAILED lead list for research.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const { organizationId } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId },
    select: { id: true, status: true, totalLeads: true },
  });

  if (!leadList) return NextResponse.json({ error: "Lead list not found" }, { status: 404 });
  if (leadList.status !== "FAILED") {
    return NextResponse.json({ error: "Only failed lead lists can be retried" }, { status: 400 });
  }

  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      type: { in: ["APOLLO", "APIFY"] },
      status: "CONNECTED",
    },
    select: { type: true },
  });
  const connected = new Set(integrations.map((i) => i.type));
  const mode = connected.has("APOLLO") ? "apollo" : connected.has("APIFY") ? "apify" : null;
  const existingLeadCount = await prisma.lead.count({ where: { leadListId: listId, organizationId } });

  if (!mode && existingLeadCount === 0) {
    return NextResponse.json(
      { error: "No lead source connected. Connect Apollo or Apify before retrying discovery." },
      { status: 422 }
    );
  }

  // Reset the list and any existing leads to the current 4-stage pipeline.
  await prisma.leadList.update({
    where: { id: listId },
    data: { status: "QUEUED", jobStatus: "queued", jobError: null },
  });
  if (existingLeadCount > 0) {
    await prisma.lead.updateMany({
      where: { leadListId: listId, organizationId },
      data: { status: "RESEARCHING" },
    });
  }

  const leadsPerRun = Math.max(existingLeadCount || leadList.totalLeads || 25, 5);
  await getLeadDiscoveryQueue().add(
    "lead-discovery",
    { organizationId, leadListId: listId, leadsPerRun, mode: existingLeadCount > 0 ? "import" : mode },
    { jobId: `${listId}-retry-${Date.now()}` }
  );

  return NextResponse.json({ ok: true, message: "Lead list re-queued for research" });
}
