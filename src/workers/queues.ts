import { Queue } from "bullmq";
import { Redis } from "ioredis";

let _connection: Redis | null = null;

function getConnection(): Redis {
  if (!_connection) {
    // Prefer Railway-native Redis (REDIS_URL) over Upstash — no command limits
    const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
    if (!url) throw new Error("REDIS_URL or UPSTASH_REDIS_URL is not set");
    // Upstash ALWAYS requires TLS — force it even if the URL was written as
    // redis:// (a common .env typo that silently kills the whole pipeline:
    // plaintext connections are dropped, so no job ever enqueues or runs).
    // Railway-internal Redis uses plain redis:// and stays non-TLS.
    const needsTls = url.startsWith("rediss://") || /upstash\.io/i.test(url);
    _connection = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: needsTls ? {} : undefined,
    });
  }
  return _connection;
}

function makeQueue(name: string, opts: object) {
  return new Queue(name, { connection: getConnection(), defaultJobOptions: opts as never });
}

// ─── Architecture 3: 4-stage pipeline queues (+ 1 on-demand) ─────────────────
//
// Replaces the old monolithic pipeline with focused queues:
//   lead-discovery          → Apollo/Apify search, creates RESEARCHING leads
//   lead-research           → Apify website scrape + Company Analyzer (Haiku)
//   lead-qualification      → Qualification Agent (Haiku), scores 0-100
//   lead-personalization    → Personalization Agent (Sonnet), writes email copy
//
// On-demand (NOT auto-enqueued by the pipeline — fed only by the leads-page
// "get founder email" buttons via /api/leads/[listId]/enrich-founders):
//   lead-founder-enrichment → LinkedIn founder email via Apify (harvestapi)
//
// Each queue processes one lead at a time with concurrency=10, so 10 leads
// are researched/qualified/personalized simultaneously per worker process.

export function getLeadDiscoveryQueue() {
  return makeQueue("lead-discovery", {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    timeout: 10 * 60 * 1000, // 10 min — discovery is fast (one API call)
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  });
}

export function getLeadResearchQueue() {
  return makeQueue("lead-research", {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    timeout: 5 * 60 * 1000, // 5 min — scrape + Haiku call
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  });
}

export function getLeadQualificationQueue() {
  return makeQueue("lead-qualification", {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    timeout: 3 * 60 * 1000, // 3 min — single Haiku call
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  });
}

export function getLeadFounderEnrichmentQueue() {
  return makeQueue("lead-founder-enrichment", {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    timeout: 10 * 60 * 1000, // 10 min — on-demand actor run is 20–60s, allow headroom
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
  });
}

export function getLeadPersonalizationQueue() {
  return makeQueue("lead-personalization", {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    timeout: 3 * 60 * 1000, // 3 min — single Sonnet call
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 100 },
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
  step: 0 | 1 | 2 | 3; // 0 = initial, 1 = FU1, 2 = FU2, 3 = FU3
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
