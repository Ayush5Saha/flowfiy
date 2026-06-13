/* Live diagnostic for the Flowfiy lead pipeline.
 * Answers: is Redis reachable? is the worker consuming jobs? are jobs failing
 * (and why)? what do the most recent lead-list logs say?
 *
 *   node scripts/diagnose-pipeline.js
 */
"use strict";
const fs = require("fs");
const Redis = require("ioredis");

// load .env.local
for (const line of (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
if (!url) { console.error("No REDIS_URL / UPSTASH_REDIS_URL in .env.local"); process.exit(1); }
console.log("Redis:", url.replace(/:\/\/[^@]*@/, "://***@"));

const QUEUES = ["lead-discovery", "lead-research", "lead-qualification", "lead-personalization", "lead-generation-pipeline", "email-send"];

(async () => {
  const r = new Redis(url, { maxRetriesPerRequest: 3, connectTimeout: 15000, lazyConnect: true });
  try {
    await r.connect();
    const pong = await r.ping();
    console.log("PING:", pong, "\n");
  } catch (e) {
    console.error("✖ Cannot reach Redis:", e.message);
    console.error("  → If this fails, the worker can't either. Check UPSTASH_REDIS_URL / Upstash dashboard (command-limit, paused db).");
    process.exit(1);
  }

  console.log("── BullMQ queue state (per queue) ──");
  console.log("queue".padEnd(24), "wait", "actv", "delay", "fail", "done");
  let totalWait = 0, totalActive = 0, totalFailed = 0, totalDone = 0;
  const failedReasons = [];
  for (const q of QUEUES) {
    const p = `bull:${q}:`;
    const [wait, active, delayed, failed, done] = await Promise.all([
      r.llen(p + "wait").catch(() => 0),
      r.llen(p + "active").catch(() => 0),
      r.zcard(p + "delayed").catch(() => 0),
      r.zcard(p + "failed").catch(() => 0),
      r.zcard(p + "completed").catch(() => 0),
    ]);
    totalWait += wait; totalActive += active; totalFailed += failed; totalDone += done;
    console.log(q.padEnd(24), String(wait).padEnd(4), String(active).padEnd(4), String(delayed).padEnd(5), String(failed).padEnd(4), String(done));
    // pull up to 3 recent failed reasons
    if (failed > 0) {
      const ids = await r.zrevrange(p + "failed", 0, 2).catch(() => []);
      for (const id of ids) {
        const reason = await r.hget(`${p}${id}`, "failedReason").catch(() => null);
        if (reason) failedReasons.push(`[${q}#${id}] ${String(reason).slice(0, 200)}`);
      }
    }
  }

  console.log("\n── interpretation ──");
  if (totalActive === 0 && totalWait > 0)
    console.log(`⚠ ${totalWait} job(s) WAITING but 0 ACTIVE → the worker is NOT running (or can't reach Redis). Start it: npm run worker:dev`);
  else if (totalActive > 0)
    console.log(`• ${totalActive} job(s) ACTIVE → a worker IS processing. If it never finishes, an actor call is hanging (Apify timeouts) or looping rounds.`);
  else if (totalWait === 0 && totalActive === 0)
    console.log("• No waiting/active jobs. Either nothing was enqueued, or everything already drained.");
  if (totalFailed > 0) console.log(`✖ ${totalFailed} FAILED job(s) — reasons below.`);

  if (failedReasons.length) {
    console.log("\n── recent failure reasons ──");
    failedReasons.forEach((x) => console.log("  " + x));
  }

  // most-recent lead-list logs
  console.log("\n── recent lead-list logs (lead_logs:*) ──");
  const keys = [];
  let cursor = "0";
  do {
    const [next, batch] = await r.scan(cursor, "MATCH", "lead_logs:*", "COUNT", 100);
    cursor = next; keys.push(...batch);
    if (keys.length > 50) break;
  } while (cursor !== "0");
  if (!keys.length) {
    console.log("  (no lead_logs:* keys — no recent runs, or logs expired/cleared, or wrong Redis)");
  } else {
    // newest list by TTL-ish: just show each list's last few entries
    for (const k of keys.slice(0, 3)) {
      const raw = await r.lrange(k, 0, 11); // newest first
      console.log(`\n  ${k}  (${raw.length} entries shown):`);
      raw.reverse().forEach((s) => {
        try { const e = JSON.parse(s); console.log(`    [${e.level}] ${e.msg}`); } catch {}
      });
    }
  }

  await r.quit();
  console.log("\nDone.");
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
