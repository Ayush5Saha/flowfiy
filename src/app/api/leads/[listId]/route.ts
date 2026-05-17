import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/leads/[listId] — archive a lead list (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId },
    select: { id: true, status: true },
  });
  if (!leadList) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Soft-delete by archiving
  await prisma.leadList.update({
    where: { id: listId },
    data: { status: "ARCHIVED" },
  });

  return NextResponse.json({ ok: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId },
    include: {
      leads: {
        include: { research: true, outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: [{ qualificationScore: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!leadList) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ leadList });
}
