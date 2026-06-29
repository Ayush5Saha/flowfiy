import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET /api/leads?organizationId=xxx
// Returns all lead lists for an organization
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const organizationId = req.nextUrl.searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadLists = await prisma.leadList.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      totalLeads: true,
      qualifiedLeads: true,
      createdAt: true,
      // How many QUALIFIED leads actually have an email address — i.e. how many
      // a campaign could really email. Leads from Google Maps (local businesses)
      // frequently have none, so this can be far below qualifiedLeads.
      _count: {
        select: {
          leads: {
            where: { status: "QUALIFIED", email: { not: null }, NOT: { email: "" } },
          },
        },
      },
    },
  });

  // Flatten the filtered relation count into a plain `emailableLeads` field.
  const withEmailable = leadLists.map(({ _count, ...list }) => ({
    ...list,
    emailableLeads: _count.leads,
  }));

  return NextResponse.json({ leadLists: withEmailable });
}
