import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { resumeList } from "@/lib/pipeline-pause";
import { appendLog } from "@/lib/job-logs";
import { getLeadDiscoveryQueue } from "@/workers/queues";

const schema = z.object({ organizationId: z.string().uuid() });

// POST /api/leads/[listId]/resume — clear the pause flag and re-enter the
// discovery/top-up loop from the next round.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  const { organizationId } = parsed.data;

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId },
    select: { id: true, status: true, discoveryRound: true, targetQualified: true, totalLeads: true },
  });
  if (!leadList) return NextResponse.json({ error: "Lead list not found" }, { status: 404 });

  // Always clear the flag so the pipeline is unblocked.
  await resumeList(listId);

  if (leadList.status === "READY") {
    return NextResponse.json({ ok: true, message: "Search already complete" });
  }

  const leadRequest = await prisma.leadRequest.findUnique({
    where: { leadListId: listId },
    select: { id: true },
  });

  const nextRound = (leadList.discoveryRound ?? 1) + 1;
  const leadsPerRun = leadList.targetQualified ?? leadList.totalLeads ?? 25;

  await prisma.leadList.update({
    where: { id: listId },
    data: { status: "RESEARCHING", jobStatus: "discovering_leads", discoveryRound: nextRound, jobError: null },
  });
  await appendLog(listId, "Search resumed — looking for more leads.", "info").catch(() => null);

  await getLeadDiscoveryQueue().add(
    "lead-discovery",
    leadRequest
      ? { organizationId, leadListId: listId, mode: "nl", leadRequestId: leadRequest.id, leadsPerRun, round: nextRound }
      : { organizationId, leadListId: listId, leadsPerRun, round: nextRound },
    { jobId: `resume-${listId}-r${nextRound}` }
  );

  return NextResponse.json({ ok: true, resumed: true });
}
