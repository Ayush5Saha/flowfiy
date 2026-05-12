import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { encryptCredentials, decryptCredentials } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";
import { IntegrationType } from "@prisma/client";

const upsertSchema = z.object({
  organizationId: z.string().uuid(),
  type: z.nativeEnum(IntegrationType),
  credentials: z.record(z.string()),
});

async function assertMember(userId: string, organizationId: string) {
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  return member;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { organizationId, type, credentials } = parsed.data;
  const member = await assertMember(user.id, organizationId);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const encrypted = encryptCredentials(credentials);
  const integration = await prisma.integration.upsert({
    where: { organizationId_type: { organizationId, type } },
    create: {
      organizationId,
      type,
      encryptedCredentials: encrypted,
      status: "CONNECTED",
      lastValidatedAt: new Date(),
    },
    update: {
      encryptedCredentials: encrypted,
      status: "CONNECTED",
      lastValidatedAt: new Date(),
    },
  });

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "integration.connected",
    resourceType: "integration",
    resourceId: integration.id,
    metadata: { type },
  });

  return NextResponse.json({
    integration: {
      id: integration.id,
      type: integration.type,
      status: integration.status,
      lastValidatedAt: integration.lastValidatedAt,
    },
  });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  if (!organizationId) return NextResponse.json({ error: "organizationId required" }, { status: 400 });

  const member = await assertMember(user.id, organizationId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const integrations = await prisma.integration.findMany({
    where: { organizationId },
    select: { id: true, type: true, status: true, lastValidatedAt: true, createdAt: true },
  });

  return NextResponse.json({ integrations });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get("organizationId");
  const type = searchParams.get("type") as IntegrationType;

  if (!organizationId || !type) {
    return NextResponse.json({ error: "organizationId and type required" }, { status: 400 });
  }

  const member = await assertMember(user.id, organizationId);
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.integration.update({
    where: { organizationId_type: { organizationId, type } },
    data: { status: "DISCONNECTED" },
  });

  await createAuditLog({
    organizationId,
    userId: user.id,
    action: "integration.disconnected",
    metadata: { type },
  });

  return NextResponse.json({ success: true });
}
