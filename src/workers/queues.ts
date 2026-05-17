import { Queue } from "bullmq";
import { Redis } from "ioredis";

let _connection: Redis | null = null;

function getConnection(): Redis {
  if (!_connection) {
    const url = process.env.UPSTASH_REDIS_URL;
    if (!url) throw new Error("UPSTASH_REDIS_URL is not set");
    _connection = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Enable TLS when URL uses rediss:// scheme (production Upstash)
      tls: url.startsWith("rediss://") ? {} : undefined,
    });
  }
  return _connection;
}

function makeQueue(name: string, opts: object) {
  return new Queue(name, { connection: getConnection(), defaultJobOptions: opts as never });
}

export function getLeadGenerationQueue() {
  return makeQueue("lead-generation-pipeline", {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

export function getEmailSendQueue() {
  return makeQueue("email-send", {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 200 },
  });
}

export function getRedisConnection(): Redis {
  return getConnection();
}

// ─── Follow-up scheduling helper ─────────────────────────────────────────────

export interface EmailJobData {
  campaignLeadId: string;
  organizationId: string;
  step: 0 | 1 | 2; // 0 = initial, 1 = follow-up 1, 2 = follow-up 2
}

/**
 * Enqueue an email send job, optionally delayed (for follow-ups).
 * delayMs = 0 means "send now" (initial email).
 */
export async function enqueueEmailJob(data: EmailJobData, delayMs = 0) {
  const queue = getEmailSendQueue();
  const stepLabel = data.step === 0 ? "initial" : `follow-up-${data.step}`;
  await queue.add(`email-${stepLabel}`, data, {
    delay: delayMs,
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 200 },
  });
}
