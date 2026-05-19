/**
 * PATCH /api/webhooks/[id]  — update url / events / isActive
 * DELETE /api/webhooks/[id] — remove a webhook endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgAccess } from "@/lib/auth-helpers";

const VALID_EVENTS = [
  "lead.qualified",
  "reply.received",
  "campaign.completed",
  "meeting.booked",
  "bounce.detected",
  "unsubscribe.received",
] as const;

const patchSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://"), "URL must use HTTPS")
    .optional(),
  events: z.array(z.enum(VALID_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
});

async function getEndpointForOrg(id: string, organizationId: string) {
  return prisma.webhookEndpoint.findFirst({
    where: { id, organizationId },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOrgAccess(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await getEndpointForOrg(id, auth.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updated = await prisma.webhookEndpoint.update({
    where: { id },
    data: {
      ...(parsed.data.url && { url: parsed.data.url }),
      ...(parsed.data.events && { events: parsed.data.events }),
      ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastDeliveredAt: true,
      failureCount: true,
    },
  });

  return NextResponse.json({ endpoint: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOrgAccess(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await getEndpointForOrg(id, auth.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.webhookEndpoint.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
