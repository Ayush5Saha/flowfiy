import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { pauseList } from "@/lib/pipeline-pause";
import { appendLog } from "@/lib/job-logs";

const schema = z.object({ organizationId: z.string().uuid() });

// POST /api/leads/[listId]/pause — suspend the discovery/top-up loop for a run.
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
    select: { id: true, status: true },
  });
  if (!leadList) return NextResponse.json({ error: "Lead list not found" }, { status: 404 });
  if (!["QUEUED", "RESEARCHING"].includes(leadList.status)) {
    return NextResponse.json({ error: "Only an in-progress search can be paused" }, { status: 400 });
  }

  await pauseList(listId);
  // Cosmetic — the Redis flag is the source of truth; jobStatus is just for display.
  await prisma.leadList.update({ where: { id: listId }, data: { jobStatus: "paused" } }).catch(() => null);
  await appendLog(listId, "Search paused. Leads already found will finish processing.", "info").catch(() => null);

  return NextResponse.json({ ok: true, paused: true });
}
