import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/outreach/[copyId]
 *
 * Edit and/or approve a single OutreachCopy record.
 * Body: { subjectLine?, body?, followUp1?, followUp2?, followUp3?, approve?: boolean }
 *
 * - Passing `approve: true` sets isApproved = true.
 * - Passing `approve: false` revokes approval (e.g. after editing).
 * - Any content field update automatically revokes approval so stale copy
 *   can never slip through to a campaign.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ copyId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { copyId } = await params;

  // Load copy + org for membership check
  const copy = await prisma.outreachCopy.findUnique({
    where: { id: copyId },
    select: { id: true, organizationId: true },
  });
  if (!copy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: copy.organizationId, userId: user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    subjectLine?: string;
    body?: string;
    followUp1?: string;
    followUp2?: string;
    followUp3?: string;
    approve?: boolean;
  };

  const contentEdited =
    body.subjectLine !== undefined ||
    body.body !== undefined ||
    body.followUp1 !== undefined ||
    body.followUp2 !== undefined ||
    body.followUp3 !== undefined;

  // If content was edited and approve wasn't explicitly set to true,
  // revoke approval — forces human to re-confirm after any edit.
  const isApproved =
    body.approve === true
      ? true
      : body.approve === false || contentEdited
        ? false
        : undefined; // no change

  const updated = await prisma.outreachCopy.update({
    where: { id: copyId },
    data: {
      ...(body.subjectLine !== undefined && { subjectLine: body.subjectLine }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.followUp1 !== undefined && { followUp1: body.followUp1 }),
      ...(body.followUp2 !== undefined && { followUp2: body.followUp2 }),
      ...(body.followUp3 !== undefined && { followUp3: body.followUp3 }),
      ...(isApproved !== undefined && { isApproved }),
    },
    select: {
      id: true,
      subjectLine: true,
      body: true,
      followUp1: true,
      followUp2: true,
      followUp3: true,
      variant: true,
      isApproved: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ copy: updated });
}
