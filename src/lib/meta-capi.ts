import { createHash } from "crypto";

/**
 * Meta (Facebook) Conversions API — server-side conversion tracking.
 *
 * Fires Purchase events straight from our payment webhooks, so conversions are
 * recorded even when the browser pixel is blocked or the user closes the tab,
 * and so subscription *renewals* (which never touch the browser) are tracked.
 *
 * Deduplication: pass the same `eventId` here as the browser pixel sends via
 * its `eventID` option. Meta collapses the two into one conversion.
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
const DEFAULT_SOURCE_URL =
  (process.env.NEXT_PUBLIC_APP_URL || "https://flowfiy.com") + "/billing";

/** Meta requires user identifiers to be SHA-256 hashed, lowercased + trimmed. */
function hash(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
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
  if (!ACCESS_TOKEN) return; // CAPI not configured — skip silently

  try {
    const userData: Record<string, unknown> = {};
    if (params.email) userData.em = [hash(params.email)];

    const body = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: params.eventId,
          event_source_url: params.eventSourceUrl || DEFAULT_SOURCE_URL,
          user_data: userData,
          custom_data: {
            value: params.value,
            currency: params.currency.toUpperCase(),
            ...(params.plan
              ? { content_name: params.plan, content_type: "subscription" }
              : {}),
          },
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
        `[meta-capi] Purchase failed (${res.status}):`,
        await res.text()
      );
    } else {
      console.log(
        `[meta-capi] Purchase sent: event_id=${params.eventId}, value=${params.value} ${params.currency}`
      );
    }
  } catch (err) {
    console.error("[meta-capi] Failed to send Purchase event:", err);
  }
}
