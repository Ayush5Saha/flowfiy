import { customAlphabet } from "nanoid";

// 8-char uppercase alphanumeric, no ambiguous chars (0/O, 1/I/L)
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateReferralCode(): string {
  return nanoid();
}
