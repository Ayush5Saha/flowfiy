/**
 * GET  /api/webhooks  — list all webhook endpoints for the org
 * POST /api/webhooks  — create a new webhook endpoint
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgAccess } from "@/lib/auth-helpers";
import { generateWebhookSecret } from "@/lib/webhooks";

const VALID_EVENTS = [
  "lead.qualified",
  "reply.received",
  "campaign.completed",
  "meeting.booked",
  "bounce.detected",
  "unsubscribe.received",
] as const;

const createSchema = z.object({
  url: z.string().url("Must be a valid HTTPS URL").refine(
    (u) => u.startsWith("https://"),
    "URL must use HTTPS"
  ),
  events: z
    .array(z.enum(VALID_EVENTS))
    .min(1, "Subscribe to at least one event"),
});

export async function GET(req: NextRequest) {
  const auth = await requireOrgAccess(req);
  if (!auth.ok) return auth.response;

  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { organizationId: auth.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      lastDeliveredAt: true,
      failureCount: true,
      createdAt: true,
      // Never return the secret after creation
    },
  });

  return NextResponse.json({ endpoints });
}

export async function POST(req: NextRequest) {
  const auth = await requireOrgAccess(req);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { url, events } = parsed.data;
  const secret = generateWebhookSecret();

  const endpoint = await prisma.webhookEndpoint.create({
    data: {
      organizationId: auth.organizationId,
      url,
      events,
      secret,
    },
    select: {
      id: true,
      url: true,
      events: true,
      isActive: true,
      secret: true, // returned ONCE at creation — client must store it
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      endpoint,
      warning:
        "Save the secret — it will never be shown again. Use it to verify incoming webhook signatures.",
    },
    { status: 201 }
  );
}
