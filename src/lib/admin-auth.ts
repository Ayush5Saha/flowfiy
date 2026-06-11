import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// Built-in "owner" super-admin. Always able to log in and manage the team, even
// before any admin_users rows exist. Override via env in production.
const OWNER_EMAIL = (process.env.ADMIN_EMAIL || "sahaayush6000@gmail.com").toLowerCase();
const OWNER_PASSWORD = process.env.ADMIN_PASSWORD || "AyushSaha123";
const COOKIE_NAME = "admin_token";

export type AdminRole = "OWNER" | "ADMIN";

export interface AdminSession {
  email: string;
  name: string;
  role: AdminRole;
}

function getSecret(): string {
  return process.env.ENCRYPTION_KEY || "admin-fallback-secret-key";
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

  // Built-in owner — checked first so the founder is never locked out.
  if (normalized === OWNER_EMAIL && password === OWNER_PASSWORD) {
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
