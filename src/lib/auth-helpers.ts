/**
 * Shared auth + org access helper for API routes.
 *
 * Usage:
 *   const auth = await requireOrgAccess(req);
 *   if (!auth.ok) return auth.response;
 *   // auth.organizationId is available here
 *
 * Reads organizationId from:
 *   1. X-Organization-Id header (preferred for programmatic API access)
 *   2. Query param ?orgId=...
 *
 * Falls back to the user's first org if neither is provided.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type AuthSuccess = { ok: true; organizationId: string; userId: string };
type AuthFailure = { ok: false; response: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

export async function requireOrgAccess(req: NextRequest): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Resolve org ID from header or query param
  let organizationId =
    req.headers.get("x-organization-id") ??
    req.nextUrl.searchParams.get("orgId") ??
    null;

  if (!organizationId) {
    // Fall back to first org the user is a member of
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    if (!membership) {
      return {
        ok: false,
        response: NextResponse.json({ error: "No organization found" }, { status: 404 }),
      };
    }
    organizationId = membership.organizationId;
  }

  // Verify the user is actually a member of the resolved org
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });

  if (!member) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, organizationId, userId: user.id };
}
