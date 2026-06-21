import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLogs } from "@/lib/job-logs";
import { isPaused } from "@/lib/pipeline-pause";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;

  // Verify the user has access to this lead list
  const leadList = await prisma.leadList.findFirst({
    where: {
      id: listId,
      organization: { members: { some: { userId: user.id } } },
    },
    select: { id: true, status: true, jobStatus: true },
  });

  if (!leadList) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [logs, paused] = await Promise.all([getLogs(listId), isPaused(listId)]);

  return NextResponse.json({
    logs,
    listStatus: leadList.status,
    jobStatus: leadList.jobStatus,
    paused,
  });
}
