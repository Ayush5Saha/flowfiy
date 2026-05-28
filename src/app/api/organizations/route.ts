import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

/**
 * Converts BigInt fields (monthlyTokensUsed) to Number so JSON.stringify
 * doesn't throw "Do not know how to serialize a BigInt".
 */
function safeOrg(org: Record<string, unknown>) {
  return {
    ...org,
    monthlyTokensUsed: typeof org.monthlyTokensUsed === "bigint"
      ? Number(org.monthlyTokensUsed)
      : org.monthlyTokensUsed,
  };
}

const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let suffix = 0;
  while (true) {
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
    suffix++;
    slug = `${base}-${suffix}`;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name } = parsed.data;
  const slug = await uniqueSlug(slugify(name));

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
  });

  await createAuditLog({
    organizationId: org.id,
    userId: user.id,
    action: "org.created",
    resourceType: "organization",
    resourceId: org.id,
  });

  return NextResponse.json({ organization: safeOrg(org as unknown as Record<string, unknown>) }, { status: 201 });
}

const updateOrgSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(2).max(100),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateOrgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, name } = parsed.data;
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { name },
  });

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "org.updated",
    resourceType: "organization",
    resourceId: org.id,
  });

  return NextResponse.json({ organization: safeOrg(org as unknown as Record<string, unknown>) });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: true },
  });

  return NextResponse.json({
    organizations: memberships.map((m) => ({
      ...safeOrg(m.organization as unknown as Record<string, unknown>),
      role: m.role,
    })),
  });
}
