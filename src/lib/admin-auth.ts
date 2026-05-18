import crypto from "crypto";

const ADMIN_EMAIL = "sahaayush6000@gmail.com";
const ADMIN_PASSWORD = "AyushSaha123";
const COOKIE_NAME = "admin_token";

function getSecret(): string {
  return process.env.ENCRYPTION_KEY || "admin-fallback-secret-key";
}

export function generateAdminToken(): string {
  const payload = JSON.stringify({
    email: ADMIN_EMAIL,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const { payload, sig } = JSON.parse(decoded);
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return false;
    }
    const { exp } = JSON.parse(payload);
    return Date.now() < exp;
  } catch {
    return false;
  }
}

export function validateAdminCredentials(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

export { COOKIE_NAME as ADMIN_COOKIE_NAME };
