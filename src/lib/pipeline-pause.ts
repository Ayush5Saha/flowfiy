/**
 * Pause / resume flag for a lead-search run.
 *
 * Stored in Redis (like job-logs) rather than on the LeadList row on purpose: the
 * pipeline writes `status` / `jobStatus` constantly as it advances through stages
 * and rounds, so a column there would race with those writes. A dedicated Redis
 * key is the single, churn-free source of truth the workers and the UI both read.
 *
 * Semantics: a paused run stops DISCOVERY — no new Apify search round is started
 * and the top-up loop is suspended. Leads already discovered keep flowing through
 * research → qualification → outreach (cheap Gemini work; stopping it mid-way would
 * strand them). Resuming clears the flag and kicks off the next discovery round.
 */
import { getRedisConnection } from "@/workers/queues";

const KEY_PREFIX = "lead_paused:";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — long enough to survive a real pause

function key(leadListId: string) {
  return `${KEY_PREFIX}${leadListId}`;
}

export async function pauseList(leadListId: string): Promise<void> {
  const redis = getRedisConnection();
  await redis.set(key(leadListId), "1", "EX", TTL_SECONDS);
}

export async function resumeList(leadListId: string): Promise<void> {
  const redis = getRedisConnection();
  await redis.del(key(leadListId));
}

export async function isPaused(leadListId: string): Promise<boolean> {
  const redis = getRedisConnection();
  return (await redis.get(key(leadListId))) === "1";
}

/** Batched lookup for list views — one round-trip for many lists. */
export async function pausedListIds(leadListIds: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (leadListIds.length === 0) return out;
  const redis = getRedisConnection();
  const values = await redis.mget(...leadListIds.map(key));
  leadListIds.forEach((id, i) => {
    if (values[i] === "1") out.add(id);
  });
  return out;
}
