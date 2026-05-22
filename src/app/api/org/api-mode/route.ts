// PATCH /api/org/api-mode
// Body: { mode: "CENTRAL" | "BYOK" }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const schema = z.object({ mode: z.enum(["CENTRAL", "BYOK"]) });

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mode" }, { status: 400 });

  // Get org membership
  const member = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    select: {
      organizationId: true,
      role: true,
      organization: { select: { plan: true } },
    },
  });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only OWNER/ADMIN can change mode
  if (member.role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  // FREE/INDIE can't switch to CENTRAL
  if (
    (member.organization.plan === "FREE" || member.organization.plan === "INDIE") &&
    parsed.data.mode === "CENTRAL"
  ) {
    return NextResponse.json({ error: "Upgrade to switch to managed AI" }, { status: 403 });
  }

  await prisma.organization.update({
    where: { id: member.organizationId },
    data: { apiMode: parsed.data.mode },
  });

  return NextResponse.json({ success: true, mode: parsed.data.mode });
}
