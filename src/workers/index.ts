import "./load-env"; // MUST be first — populates process.env for the standalone worker
import { Worker } from "bullmq";
import { getRedisConnection } from "./queues";
import { processLeadDiscovery } from "./processors/lead-discovery.processor";
import { processLeadResearch } from "./processors/lead-research.processor";
import { processLeadQualification } from "./processors/lead-qualification.processor";
import { processLeadPersonalization } from "./processors/lead-personalization.processor";
import { processEmailSend } from "./processors/email-send.processor";
import type { EmailJobData } from "./processors/email-send.processor";

console.log("[worker] Starting Flowfiy workers...");

const connection = getRedisConnection();

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

// Gemini-backed stages run at concurrency 10. The platform Gemini key is on a
// paid tier (Tier 1 ≈ 1000+ RPM), so bursting all leads at once is safe; the
// client's 429 backoff still covers brief spikes. Drop this back to ~3 if a key
// ever reverts to the free tier's ~10–15 RPM.
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
    leadDiscoveryWorker.close(),
    leadResearchWorker.close(),
    leadQualificationWorker.close(),
    leadPersonalizationWorker.close(),
    emailSendWorker.close(),
  ]);
  process.exit(0);
});
