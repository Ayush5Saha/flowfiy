import { getRedisConnection } from "@/workers/queues";

export interface LogEntry {
  ts: number;
  level: "info" | "success" | "error" | "tool";
  msg: string;
}

const KEY_PREFIX = "lead_logs:";
const TTL_SECONDS = 60 * 60 * 24; // 24 hours
const MAX_ENTRIES = 500;

function key(leadListId: string) {
  return `${KEY_PREFIX}${leadListId}`;
}

export async function appendLog(leadListId: string, msg: string, level: LogEntry["level"] = "info") {
  const redis = getRedisConnection();
  const entry: LogEntry = { ts: Date.now(), level, msg };
  await redis.lpush(key(leadListId), JSON.stringify(entry));
  await redis.ltrim(key(leadListId), 0, MAX_ENTRIES - 1);
  await redis.expire(key(leadListId), TTL_SECONDS);
}

export async function getLogs(leadListId: string): Promise<LogEntry[]> {
  const redis = getRedisConnection();
  const raw = await redis.lrange(key(leadListId), 0, -1);
  // LPUSH puts newest first — reverse for chronological order
  return raw
    .map((s) => {
      try { return JSON.parse(s) as LogEntry; } catch { return null; }
    })
    .filter(Boolean)
    .reverse() as LogEntry[];
}

export async function clearLogs(leadListId: string) {
  const redis = getRedisConnection();
  await redis.del(key(leadListId));
}
