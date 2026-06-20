import "./load-env"; // MUST be first — populates process.env for the standalone worker
import { Worker } from "bullmq";
import { getRedisConnection } from "./queues";
import { processLeadGeneration } from "./processors/lead-generation.processor";
import { processLeadDiscovery } from "./processors/lead-discovery.processor";
import { processLeadResearch } from "./processors/lead-research.processor";
import { processLeadQualification } from "./processors/lead-qualification.processor";
import { processLeadPersonalization } from "./processors/lead-personalization.processor";
import { processEmailSend } from "./processors/email-send.processor";
import type { EmailJobData } from "./processors/email-send.processor";

console.log("[worker] Starting Flowfiy workers...");

const connection = getRedisConnection();

// ─── Legacy pipeline (kept alive to drain any existing jobs in Redis) ─────────
// New runs are enqueued to lead-discovery. Old runs in Redis will drain naturally.

const leadGenerationWorker = new Worker(
  "lead-generation-pipeline",
  processLeadGeneration,
  { connection, concurrency: 3 }
);

// ─── Architecture 3: 4-stage pipeline workers ────────────────────────────────
//
//   lead-discovery (concurrency=3)  — one job per LeadList, fans out research jobs
//   lead-research  (concurrency=10) — parallel per-lead: scrape + Company Analyzer (Haiku)
//   lead-qualification (concurrency=10) — parallel per-lead: Qualification Agent (Haiku)
//   lead-personalization (concurrency=10) — parallel per-lead: Personalization Agent (Sonnet)

const leadDiscoveryWorker = new Worker(
  "lead-discovery",
  processLeadDiscovery,
  { connection, concurrency: 3 }
);

const leadResearchWorker = new Worker(
  "lead-research",
  processLeadResearch,
  { connection, concurrency: 10 }
);

const leadQualificationWorker = new Worker(
  "lead-qualification",
  processLeadQualification,
  { connection, concurrency: 10 }
);

const leadPersonalizationWorker = new Worker(
  "lead-personalization",
  processLeadPersonalization,
  { connection, concurrency: 10 }
);

// ─── Email send worker ────────────────────────────────────────────────────────

const emailSendWorker = new Worker(
  "email-send",
  processEmailSend,
  {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 3600_000 },
  }
);

// ─── Event listeners ──────────────────────────────────────────────────────────

leadGenerationWorker.on("completed", (job) => {
  console.log(`[worker] Lead gen job ${job.id} completed`);
});
leadGenerationWorker.on("failed", (job, err) => {
  console.error(`[worker] Lead gen job ${job?.id} failed:`, err.message);
});

leadDiscoveryWorker.on("completed", (job) => {
  console.log(`[worker] Discovery job ${job.id} completed`);
});
leadDiscoveryWorker.on("failed", (job, err) => {
  console.error(`[worker] Discovery job ${job?.id} failed:`, err.message);
});

leadResearchWorker.on("completed", (job) => {
  console.log(`[worker] Research job ${job.id} completed`);
});
leadResearchWorker.on("failed", (job, err) => {
  console.error(`[worker] Research job ${job?.id} failed:`, err.message);
});

leadQualificationWorker.on("completed", (job) => {
  console.log(`[worker] Qualification job ${job.id} completed`);
});
leadQualificationWorker.on("failed", (job, err) => {
  console.error(`[worker] Qualification job ${job?.id} failed:`, err.message);
});

leadPersonalizationWorker.on("completed", (job) => {
  console.log(`[worker] Personalization job ${job.id} completed`);
});
leadPersonalizationWorker.on("failed", (job, err) => {
  console.error(`[worker] Personalization job ${job?.id} failed:`, err.message);
});

emailSendWorker.on("completed", (job) => {
  const data = job.data as EmailJobData;
  const label = data.step === 0 ? "initial" : `follow-up-${data.step}`;
  console.log(`[worker] Email job ${job.id} (${label}) completed`);
});
emailSendWorker.on("failed", (job, err) => {
  const data = job?.data as EmailJobData | undefined;
  const label = data ? (data.step === 0 ? "initial" : `follow-up-${data.step}`) : "unknown";
  console.error(`[worker] Email job ${job?.id} (${label}) failed:`, err.message);
});

process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM received. Closing workers...");
  await Promise.all([
    leadGenerationWorker.close(),
    leadDiscoveryWorker.close(),
    leadResearchWorker.close(),
    leadQualificationWorker.close(),
    leadPersonalizationWorker.close(),
    emailSendWorker.close(),
  ]);
  process.exit(0);
});
