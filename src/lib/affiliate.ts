import { randomBytes, createHmac } from "crypto";

/** Generate a short unique affiliate code like "MKTR7F2A" */
export function generateAffiliateCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

/** Create a 32-byte hex access token + expiry 30 days from now */
export function createAccessToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { token, expiresAt };
}

/** Cookie name used for affiliate dashboard sessions */
export const AFFILIATE_SESSION_COOKIE = "affiliate_session";

/** Minimum payout threshold in paise (₹500) */
export const MIN_PAYOUT_PAISE = 50000n;

/** Format paise as ₹ string */
export function formatPaise(paise: bigint): string {
  const rupees = Number(paise) / 100;
  return `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Sign a payload with AFFILIATE_TOKEN_SECRET (for optional HMAC verification) */
export function signToken(data: string): string {
  const secret = process.env.AFFILIATE_TOKEN_SECRET ?? "fallback_secret_change_me";
  return createHmac("sha256", secret).update(data).digest("hex");
}
