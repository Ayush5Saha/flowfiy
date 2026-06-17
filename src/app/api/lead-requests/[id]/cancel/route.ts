import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { cancelRequest } from "@/lib/lead-requests";

// POST /api/lead-requests/[id]/cancel — release the held credits.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const { id } = await params;

  const result = await cancelRequest(membership.organizationId, id);
  if (!result.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
