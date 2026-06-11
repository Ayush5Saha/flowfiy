import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { getAdminSession, ADMIN_COOKIE_NAME, hashPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

async function requireOwner() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  return session?.role === "OWNER" ? session : null;
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["OWNER", "ADMIN"]).optional(),
  password: z.string().min(8).max(200).optional(),
  name: z.string().trim().min(2).max(80).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.role) data.role = parsed.data.role;
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.password) data.passwordHash = hashPassword(parsed.data.password);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const admin = await prisma.adminUser.update({ where: { id }, data, select: adminSelect });
    return NextResponse.json({ admin });
  } catch {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.adminUser.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
}
