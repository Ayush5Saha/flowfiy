import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getOrgMembership } from "@/lib/session";
import { confirmRequest } from "@/lib/lead-requests";
import { createAuditLog } from "@/lib/audit";

// POST /api/lead-requests/[id]/confirm — reserve credits + enqueue the run.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await getOrgMembership(user.id);
  if (!membership) return NextResponse.json({ error: "No organization" }, { status: 403 });
  const organizationId = membership.organizationId;
  const { id } = await params;

  const result = await confirmRequest(organizationId, id);

  if (!result.ok) {
    if (result.reason === "insufficient_credits") {
      return NextResponse.json(
        { error: "Not enough credits", balance: result.balance, needed: result.needed },
        { status: 402 }
      );
    }
    if (result.reason === "subscription_required") {
      return NextResponse.json(
        { error: "You've used your 100 free leads — subscribe to keep generating.", subscriptionRequired: true },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Request not found or has no plan." }, { status: 404 });
  }

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "lead_request.confirmed",
    resourceType: "lead_request",
    resourceId: id,
    metadata: { leadListId: result.leadListId },
  }).catch(() => null);

  return NextResponse.json({ ok: true, leadListId: result.leadListId });
}
