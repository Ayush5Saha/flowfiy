import { Worker } from "bullmq";
import { getRedisConnection } from "./queues";
import { processLeadGeneration } from "./processors/lead-generation.processor";
import { processEmailSend } from "./processors/email-send.processor";

console.log("[worker] Starting Flowfiy workers...");

const connection = getRedisConnection();

const leadGenerationWorker = new Worker(
  "lead-generation-pipeline",
  processLeadGeneration,
  { connection, concurrency: 3 }
);

const emailSendWorker = new Worker(
  "email-send",
  processEmailSend,
  {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 3600_000 },
  }
);

leadGenerationWorker.on("completed", (job) => {
  console.log(`[worker] Lead gen job ${job.id} completed`);
});

leadGenerationWorker.on("failed", (job, err) => {
  console.error(`[worker] Lead gen job ${job?.id} failed:`, err.message);
});

emailSendWorker.on("completed", (job) => {
  console.log(`[worker] Email send job ${job.id} completed`);
});

emailSendWorker.on("failed", (job, err) => {
  console.error(`[worker] Email send job ${job?.id} failed:`, err.message);
});

process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM received. Closing workers...");
  await leadGenerationWorker.close();
  await emailSendWorker.close();
  process.exit(0);
});
