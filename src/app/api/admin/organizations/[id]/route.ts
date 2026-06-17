import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { creditGrant } from "@/lib/credits/service";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // ── Admin credit grant (additive — comps credits to the org wallet) ─────────
  if (body.grantCredits !== undefined) {
    const amount = Math.round(Number(body.grantCredits));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
      return NextResponse.json({ error: "Enter between 1 and 100,000 credits." }, { status: 400 });
    }
    try {
      const balance = await creditGrant(id, amount, "GRANT", { refType: "admin_grant" });
      return NextResponse.json({ ok: true, balance });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: "Grant failed", detail: msg }, { status: 500 });
    }
  }

  const allowed: Record<string, unknown> = {};
  if (body.plan !== undefined) allowed.plan = body.plan;
  if (body.generationLimit !== undefined) allowed.generationLimit = Number(body.generationLimit);
  if (body.generationCount !== undefined) allowed.generationCount = Number(body.generationCount);
  if (body.apiMode !== undefined) allowed.apiMode = body.apiMode;
  if (body.resetGenerationCount === true) allowed.generationCount = 0;
  if (body.resetTokenUsage === true) {
    allowed.monthlyTokensUsed = 0;
    allowed.tokenBudgetResetAt = new Date();
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  try {
    await prisma.organization.update({
      where: { id },
      data: allowed,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Update failed", detail: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.organization.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
