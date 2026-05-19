import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-SHA256 token tied to a specific campaignLeadId + email pair.
 * Uses UNSUBSCRIBE_SECRET env var — falls back to ENCRYPTION_KEY so no new
 * env var is required in existing deployments.
 */
function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET ?? process.env.ENCRYPTION_KEY ?? "fallback-secret";
}

export function generateUnsubscribeToken(campaignLeadId: string, email: string): string {
  return createHmac("sha256", secret())
    .update(`${campaignLeadId}:${email}`)
    .digest("hex");
}

export function verifyUnsubscribeToken(
  campaignLeadId: string,
  email: string,
  token: string
): boolean {
  try {
    const expected = generateUnsubscribeToken(campaignLeadId, email);
    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(campaignLeadId: string, email: string): string {
  const token = generateUnsubscribeToken(campaignLeadId, email);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  return `${base}/api/unsubscribe?id=${encodeURIComponent(campaignLeadId)}&token=${token}`;
}

export function buildTrackingPixelUrl(campaignLeadId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://flowfiy.com";
  return `${base}/api/track/open?id=${encodeURIComponent(campaignLeadId)}`;
}
