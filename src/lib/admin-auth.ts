import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Built-in "owner" super-admin. Able to log in and manage the team even before
// any admin_users rows exist — BUT ONLY when ADMIN_PASSWORD is configured in the
// environment. There is deliberately no hardcoded password fallback: a secret in
// source is a secret for everyone. If ADMIN_PASSWORD is unset, owner bootstrap
// login is disabled and you must use a DB admin_users account instead.
const OWNER_EMAIL = (process.env.ADMIN_EMAIL || "sahaayush6000@gmail.com").toLowerCase();
const OWNER_PASSWORD = process.env.ADMIN_PASSWORD || "";
const COOKIE_NAME = "admin_token";

export type AdminRole = "OWNER" | "ADMIN";

export interface AdminSession {
  email: string;
  name: string;
  role: AdminRole;
}

/**
 * Dedicated signing key for admin session tokens.
 *
 * Resolution order:
 *   1. ADMIN_TOKEN_SECRET (explicit, preferred)
 *   2. ENCRYPTION_KEY with domain separation — so the AES data key is never
 *      reused verbatim as an HMAC key.
 *
 * There is NO guessable fallback. If neither is configured the app refuses to
 * mint or verify admin tokens (fail closed) instead of trusting a public secret.
 */
function getSecret(): Buffer {
  const explicit = process.env.ADMIN_TOKEN_SECRET;
  if (explicit && explicit.length >= 16) {
    return crypto.createHash("sha256").update(explicit).digest();
  }
  const enc = process.env.ENCRYPTION_KEY;
  if (enc && enc.length >= 32) {
    return crypto.createHmac("sha256", enc).update("flowfiy:admin-token:v1").digest();
  }
  throw new Error(
    "Admin token secret unavailable: set ADMIN_TOKEN_SECRET or ENCRYPTION_KEY"
  );
}

/** Constant-time string comparison that never throws on length mismatch. */
function safeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ─── Password hashing (scrypt — no external dependency) ───────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ─── Token (signed, role-bearing) ─────────────────────────────────────────────

export function generateAdminToken(session: AdminSession): string {
  const payload = JSON.stringify({
    email: session.email,
    name: session.name,
    role: session.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

/** Decode + verify a token. Returns the admin session, or null if invalid/expired. */
export function getAdminSession(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const { payload, sig } = JSON.parse(decoded);
    const expectedSig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const data = JSON.parse(payload) as { email: string; name?: string; role?: AdminRole; exp: number };
    if (Date.now() >= data.exp) return null;
    return { email: data.email, name: data.name ?? data.email, role: data.role === "OWNER" ? "OWNER" : "ADMIN" };
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): boolean {
  return getAdminSession(token) !== null;
}

// ─── Credential validation (founder bootstrap + DB admin users) ───────────────

export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<AdminSession | null> {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || !password) return null;

  // Built-in owner — only when ADMIN_PASSWORD is configured. Constant-time
  // comparison so the check leaks no timing signal about the secret.
  if (
    OWNER_PASSWORD &&
    safeStringEqual(normalized, OWNER_EMAIL) &&
    safeStringEqual(password, OWNER_PASSWORD)
  ) {
    return { email: OWNER_EMAIL, name: "Owner", role: "OWNER" };
  }

  // Employee admin accounts.
  const user = await prisma.adminUser.findUnique({ where: { email: normalized } });
  if (!user || !user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => null);

  return { email: user.email, name: user.name, role: user.role as AdminRole };
}

export function isOwnerEmail(email: string): boolean {
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME, OWNER_EMAIL };
