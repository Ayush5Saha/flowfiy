import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leads/[listId]/export?organizationId=...
 *
 * Streams a UTF-8 CSV file containing all leads in the list with their
 * research data and personalised outreach copy. Authenticated users only.
 *
 * Columns:
 *   First Name, Last Name, Title, Company, Website, Industry, Company Size,
 *   Email, LinkedIn URL, Country, City, Qualification Score, Qualified,
 *   Gap Identified, Subject Line, Email Body, Follow-up 1, Follow-up 2
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listId } = await params;
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId)
    return NextResponse.json(
      { error: "organizationId required" },
      { status: 400 }
    );

  // Verify membership
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const leadList = await prisma.leadList.findFirst({
    where: { id: listId, organizationId },
    select: { id: true, name: true },
  });
  if (!leadList)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leads = await prisma.lead.findMany({
    where: { leadListId: listId, organizationId },
    include: {
      research: true,
      outreachCopies: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ qualificationScore: "desc" }, { createdAt: "asc" }],
  });

  // ── Build CSV ────────────────────────────────────────────────────────────────
  const HEADERS = [
    "First Name",
    "Last Name",
    "Title",
    "Company",
    "Website",
    "Industry",
    "Company Size",
    "Email",
    "LinkedIn URL",
    "Status",
    "Qualification Score",
    "Opportunity Angle",
    "Pain Point Match",
    "Personalization Notes",
    "Subject Line",
    "Email Body",
    "Follow-up 1",
    "Follow-up 2",
  ];

  /**
   * Escape a value for CSV:
   * - Always wrap in double quotes
   * - Escape embedded double quotes by doubling them
   * - Replace literal newlines with \n so each lead stays on one row
   */
  function csvCell(value: string | number | null | undefined): string {
    const str = value == null ? "" : String(value);
    const escaped = str.replace(/"/g, '""').replace(/\r?\n/g, "\\n");
    return `"${escaped}"`;
  }

  const rows: string[] = [HEADERS.map(csvCell).join(",")];

  for (const lead of leads) {
    const outreach = lead.outreachCopies[0] ?? null;
    const research = lead.research ?? null;

    rows.push(
      [
        lead.firstName,
        lead.lastName,
        lead.title,
        lead.companyName,
        lead.companyWebsite,
        lead.industry,
        lead.companySize,
        lead.email,
        lead.linkedinUrl,
        lead.status,
        lead.qualificationScore,
        research?.opportunityAngle,
        research?.painPointMatch,
        research?.personalizationNotes,
        outreach?.subjectLine,
        outreach?.body,
        outreach?.followUp1,
        outreach?.followUp2,
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const csv = rows.join("\r\n");

  // Sanitise filename — strip characters unsafe in Content-Disposition
  const safeName = (leadList.name ?? "leads")
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}_export.csv"`,
      // Prevent caching — export should always reflect the current DB state
      "Cache-Control": "no-store",
    },
  });
}
