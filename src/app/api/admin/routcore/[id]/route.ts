import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).optional(),
  notes: z.string().max(5000).optional(),
});

async function requireAdminToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return !!token && !!verifyAdminToken(token);
}

/** Update an enquiry's pipeline status or internal notes. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminToken())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.status === undefined && parsed.data.notes === undefined) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const existing = await prisma.routcoreEnquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

  const updated = await prisma.routcoreEnquiry.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
    },
    select: { id: true, status: true, notes: true, updatedAt: true },
  });

  return NextResponse.json({ enquiry: updated });
}

/** Delete an enquiry outright (spam clean-up). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdminToken())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.routcoreEnquiry.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

  await prisma.routcoreEnquiry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
