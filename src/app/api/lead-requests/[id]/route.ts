import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/lead-requests/[id] — status + plan + linked list progress.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const { id } = await params;

  const lr = await prisma.leadRequest.findFirst({
    where: { id, organizationId: membership.organizationId },
  });
  if (!lr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let leadList = null;
  if (lr.leadListId) {
    leadList = await prisma.leadList.findUnique({
      where: { id: lr.leadListId },
      select: { id: true, status: true, jobStatus: true, totalLeads: true, qualifiedLeads: true },
    });
  }

  return NextResponse.json({
    id: lr.id,
    status: lr.status,
    plan: lr.plan,
    estimatedCredits: lr.estimatedCredits,
    actualCredits: lr.actualCredits,
    leadListId: lr.leadListId,
    error: lr.error,
    leadList,
  });
}
