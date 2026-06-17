/**
 * Website-quality auditor — the first criteria "signal provider".
 *
 * Grades a business's website so the criteria engine can match requests like
 * "no website", "slow/buggy site", or "outdated site". Cheap in-house probe
 * (one fetch + HTML heuristics) so it stays inside the LOCAL credit tier.
 */

export type WebsiteStatus = "none" | "broken" | "slow" | "outdated" | "ok";

export interface WebsiteAudit {
  status: WebsiteStatus;
  score: number;          // 0–100 health (higher = healthier)
  loadMs: number | null;
  httpStatus: number | null;
  reasons: string[];
}

const SLOW_MS = 4000;
const STALE_COPYRIGHT_BEFORE = 2023;

export async function auditWebsite(url: string | null | undefined): Promise<WebsiteAudit> {
  if (!url || !url.trim()) {
    return { status: "none", score: 0, loadMs: null, httpStatus: null, reasons: ["No website listed"] };
  }

  const target = /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`;
  const start = Date.now();

  let res: Response;
  try {
    res = await fetch(target, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FlowfiyBot/1.0)" },
    });
  } catch (err) {
    const code = (err as { cause?: { code?: string } })?.cause?.code ?? "";
    const text = `${code} ${err instanceof Error ? err.message : ""}`;
    if (/timeout|aborted/i.test(text)) {
      return { status: "slow", score: 25, loadMs: Date.now() - start, httpStatus: null, reasons: ["Did not respond within 12s"] };
    }
    return { status: "broken", score: 0, loadMs: null, httpStatus: null, reasons: [`Unreachable (${code || "connection failed"})`] };
  }

  const loadMs = Date.now() - start;
  const reasons: string[] = [];

  if (res.status >= 500) {
    return { status: "broken", score: 0, loadMs, httpStatus: res.status, reasons: [`Server error ${res.status}`] };
  }
  if (res.status >= 400) reasons.push(`HTTP ${res.status}`);

  const isHttps = res.url.startsWith("https://");
  if (!isHttps) reasons.push("No HTTPS");

  let html = "";
  try {
    html = (await res.text()).slice(0, 200_000);
  } catch {
    /* body read failed — judge on headers/timing only */
  }

  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  if (!hasViewport) reasons.push("Not mobile-friendly (no viewport meta)");

  const hasTitle = /<title[^>]*>[^<]{3,}<\/title>/i.test(html);
  if (!hasTitle) reasons.push("Missing or empty page title");

  const yearMatch = html.match(/(?:©|&copy;|copyright)[^0-9]{0,12}(\d{4})/i);
  const copyrightYear = yearMatch ? Number(yearMatch[1]) : null;
  if (copyrightYear && copyrightYear < STALE_COPYRIGHT_BEFORE) reasons.push(`Stale copyright (${copyrightYear})`);

  const textLen = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  const tiny = textLen < 600;
  if (tiny) reasons.push("Very little content");

  const slow = loadMs > SLOW_MS;
  if (slow) reasons.push(`Slow load (${(loadMs / 1000).toFixed(1)}s)`);

  let status: WebsiteStatus = "ok";
  if (res.status >= 400) status = "broken";
  else if (slow) status = "slow";
  else if (!isHttps || !hasViewport || !hasTitle || tiny || (copyrightYear !== null && copyrightYear < STALE_COPYRIGHT_BEFORE)) {
    status = "outdated";
  }

  const score = status === "ok" ? 90 : status === "slow" ? 40 : status === "outdated" ? 30 : 0;
  return {
    status,
    score,
    loadMs,
    httpStatus: res.status,
    reasons: reasons.length ? reasons : ["Healthy, modern site"],
  };
}
