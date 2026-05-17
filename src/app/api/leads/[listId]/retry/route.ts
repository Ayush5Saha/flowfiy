import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLeadGenerationQueue } from "@/workers/queues";

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

  // Reset the list to QUEUED
  await prisma.leadList.update({
    where: { id: listId },
    data: { status: "QUEUED", jobStatus: "queued", jobError: null },
  });

  // Re-enqueue (use existing leads count or default 25)
  const leadsPerRun = Math.max(leadList.totalLeads || 25, 5);
  await getLeadGenerationQueue().add(
    "lead-generation",
    { organizationId, leadListId: listId, leadsPerRun },
    { jobId: `${listId}-retry-${Date.now()}` }
  );

  return NextResponse.json({ ok: true, message: "Lead list re-queued for research" });
}
