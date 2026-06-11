import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  getAdminSession,
  ADMIN_COOKIE_NAME,
  hashPassword,
  OWNER_EMAIL,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

// Team management is OWNER-only.
async function requireOwner() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  return session?.role === "OWNER" ? session : null;
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["OWNER", "ADMIN"]).default("ADMIN"),
});

export async function GET() {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: adminSelect,
  });
  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  if (!(await requireOwner())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password, role } = parsed.data;

  // The built-in owner account isn't a DB row — block trying to recreate it.
  if (email === OWNER_EMAIL) {
    return NextResponse.json(
      { error: "That email is the built-in owner account and can't be added." },
      { status: 400 }
    );
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An admin with that email already exists." }, { status: 409 });
  }

  const admin = await prisma.adminUser.create({
    data: { name, email, passwordHash: hashPassword(password), role },
    select: adminSelect,
  });

  return NextResponse.json({ admin }, { status: 201 });
}
