/**
 * Outgoing Webhook Delivery
 *
 * Fires signed POST requests to all active webhook endpoints that are
 * subscribed to a given event type. Payload is signed with HMAC-SHA256
 * using the endpoint's secret so receiving systems can verify authenticity.
 *
 * Supported events:
 *   lead.qualified        — a lead has been qualified by the AI pipeline
 *   reply.received        — a prospect replied to an outreach email
 *   campaign.completed    — all leads in a campaign have been processed
 *   meeting.booked        — a meeting was booked with a prospect
 *   bounce.detected       — an email hard-bounced (address invalid)
 *   unsubscribe.received  — a prospect unsubscribed
 */
import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export type WebhookEventType =
  | "lead.qualified"
  | "reply.received"
  | "campaign.completed"
  | "meeting.booked"
  | "bounce.detected"
  | "unsubscribe.received";

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string; // ISO 8601
  organizationId: string;
  data: Record<string, unknown>;
}

// ── Generate a fresh webhook secret ──────────────────────────────────────────

export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

// ── Sign a payload body ───────────────────────────────────────────────────────

function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ── Deliver to a single endpoint ─────────────────────────────────────────────

async function deliverToEndpoint(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);
  const timestamp = Date.now();

  let success = false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Flowfiy-Signature": `t=${timestamp},v1=${signature}`,
        "X-Flowfiy-Event": payload.event,
        "User-Agent": "Flowfiy-Webhooks/1.0",
      },
      body,
      // 10 second timeout — we don't want slow endpoints to block processing
      signal: AbortSignal.timeout(10_000),
    });
    success = res.ok; // 2xx = success
  } catch {
    // Network error or timeout — treat as failure
    success = false;
  }

  // Update delivery metadata regardless of outcome
  if (success) {
    await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        lastDeliveredAt: new Date(),
        failureCount: 0, // reset on success
      },
    });
  } else {
    await prisma.webhookEndpoint.update({
      where: { id: endpointId },
      data: {
        failureCount: { increment: 1 },
        // Auto-disable after 10 consecutive failures to avoid hammering dead URLs
        isActive: { set: true }, // keep active — we'll disable only if failureCount threshold met
      },
    });

    // Disable endpoint after 10 consecutive failures
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: endpointId },
      select: { failureCount: true },
    });
    if (endpoint && endpoint.failureCount >= 10) {
      await prisma.webhookEndpoint.update({
        where: { id: endpointId },
        data: { isActive: false },
      });
      console.warn(`[webhook] Endpoint ${endpointId} auto-disabled after 10 failures`);
    }
  }
}

// ── Main: fire event to all subscribed endpoints ──────────────────────────────

/**
 * Fires the event to all active webhook endpoints for the org that have
 * subscribed to this event type.
 *
 * Runs all deliveries in parallel via Promise.allSettled so one slow/failed
 * endpoint never blocks the others.
 *
 * This function is fire-and-forget safe to call without await from hot paths.
 */
export async function fireWebhookEvent(
  organizationId: string,
  event: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  // Find all active endpoints subscribed to this event
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      organizationId,
      isActive: true,
      events: { has: event },
    },
    select: { id: true, url: true, secret: true },
  });

  if (endpoints.length === 0) return;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    organizationId,
    data,
  };

  await Promise.allSettled(
    endpoints.map((ep) =>
      deliverToEndpoint(ep.id, ep.url, ep.secret, payload)
    )
  );

  console.log(`[webhook] Fired "${event}" to ${endpoints.length} endpoint(s) for org ${organizationId}`);
}
