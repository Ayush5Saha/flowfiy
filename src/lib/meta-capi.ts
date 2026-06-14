import { createHash } from "crypto";

/**
 * Meta (Facebook) Conversions API — server-side event tracking.
 *
 * Fires events straight from the server (payment webhooks, OAuth callback), so
 * conversions are recorded even when the browser pixel is blocked or the user
 * closes the tab, and so events the browser never sees (subscription renewals,
 * OAuth signups that redirect away) are still tracked.
 *
 * Deduplication: pass the same `eventId` here as the browser pixel sends via
 * its `eventID` option. Meta collapses the two into one event.
 *
 * Configure with env vars (no-ops silently if the access token is absent):
 *   META_PIXEL_ID            (falls back to the public pixel id)
 *   META_CAPI_ACCESS_TOKEN   (from Events Manager → Conversions API)
 */

const PIXEL_ID =
  process.env.META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  "1625820488509651";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = "v21.0";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com";

/** Meta requires user identifiers to be SHA-256 hashed, lowercased + trimmed. */
function hash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Low-level sender. Returns nothing; logs failures, never throws. */
async function sendMetaEvent(event: {
  eventName: string;
  eventId: string;
  email?: string | null;
  customData?: Record<string, unknown>;
  eventSourceUrl?: string;
}): Promise<void> {
  if (!ACCESS_TOKEN) return; // CAPI not configured — skip silently

  try {
    const userData: Record<string, unknown> = {};
    if (event.email) userData.em = [hash(event.email)];

    const body = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl || `${APP_URL}/billing`,
          user_data: userData,
          custom_data: event.customData ?? {},
        },
      ],
      access_token: ACCESS_TOKEN,
    };

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      console.error(
        `[meta-capi] ${event.eventName} failed (${res.status}):`,
        await res.text()
      );
    } else {
      console.log(
        `[meta-capi] ${event.eventName} sent: event_id=${event.eventId}`
      );
    }
  } catch (err) {
    console.error(`[meta-capi] Failed to send ${event.eventName} event:`, err);
  }
}

export async function sendMetaPurchaseEvent(params: {
  /** Shared with the browser pixel's eventID for deduplication. */
  eventId: string;
  value: number;
  currency: string;
  email?: string | null;
  plan?: string;
  eventSourceUrl?: string;
}): Promise<void> {
  return sendMetaEvent({
    eventName: "Purchase",
    eventId: params.eventId,
    email: params.email,
    eventSourceUrl: params.eventSourceUrl,
    customData: {
      value: params.value,
      currency: params.currency.toUpperCase(),
      ...(params.plan
        ? { content_name: params.plan, content_type: "subscription" }
        : {}),
    },
  });
}

export async function sendMetaCompleteRegistration(params: {
  /** Deterministic per-user id (e.g. `reg_<userId>`) so retries dedupe. */
  eventId: string;
  email?: string | null;
  /** e.g. "google" | "email" — recorded as content_name. */
  method?: string;
  eventSourceUrl?: string;
}): Promise<void> {
  return sendMetaEvent({
    eventName: "CompleteRegistration",
    eventId: params.eventId,
    email: params.email,
    eventSourceUrl: params.eventSourceUrl || `${APP_URL}/signup`,
    customData: {
      content_name: params.method ? `${params.method}_signup` : "signup",
      status: true,
    },
  });
}
