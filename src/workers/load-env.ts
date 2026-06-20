/**
 * Load environment variables for the standalone worker process.
 *
 * The Next.js dev/prod server loads `.env.local` (and `.env*`) automatically, but
 * the BullMQ worker runs under `tsx` (`npm run worker:dev`), which does NOT.
 * Without this the worker starts with an empty environment — no DATABASE_URL,
 * REDIS_URL, GEMINI_API_KEY or APIFY_PLATFORM_TOKEN — so it throws on startup
 * ("REDIS_URL ... is not set") or every job fails downstream on a missing key.
 *
 * Import this FIRST in the worker entrypoint so env is populated before any
 * module reads it. Existing process env always wins (so real shell/host vars in
 * production are never overwritten); `.env.local` takes precedence over `.env`.
 */
import { existsSync, readFileSync } from "fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
