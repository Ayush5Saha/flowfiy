import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

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
    const org = await prisma.organization.update({
      where: { id },
      data: allowed,
    });
    return NextResponse.json({ ok: true, org });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
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
