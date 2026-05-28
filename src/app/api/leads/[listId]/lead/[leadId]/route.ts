import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  organizationId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  waStatus: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  whatsApp: z.string().max(30).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string; leadId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId, leadId } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { organizationId, ...fields } = parsed.data;

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Verify lead belongs to org + list
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, leadListId: listId, organizationId },
    select: { id: true },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...(fields.notes !== undefined && { notes: fields.notes }),
      ...(fields.waStatus !== undefined && { waStatus: fields.waStatus }),
      ...(fields.city !== undefined && { city: fields.city }),
      ...(fields.whatsApp !== undefined && { whatsApp: fields.whatsApp }),
    },
    select: { id: true, notes: true, waStatus: true, city: true, whatsApp: true },
  });

  return NextResponse.json({ lead: updated });
}
