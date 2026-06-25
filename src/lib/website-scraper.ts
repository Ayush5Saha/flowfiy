// Lightweight website scraper for onboarding profile extraction.
//
// No HTML-parsing dep: regex stripping is enough for feeding text to the LLM.
// SSRF guard is mandatory — this fetches a user-supplied URL server-side, so we
// reject loopback/private/link-local targets BEFORE any DNS/connect happens.

import { lookup } from "node:dns/promises";

/** User-facing failure that the API route maps to a 4xx with this message. */
export class ScrapeError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid_url" | "blocked_url" | "unreachable" | "not_html"
  ) {
    super(message);
    this.name = "ScrapeError";
  }
}

const FETCH_UA = "Mozilla/5.0 (compatible; FlowfiyBot/1.0)";
const FETCH_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 1_500_000; // ~1.5MB
const MAX_PAGE_CHARS = 8_000;
const MAX_TOTAL_CHARS = 35_000;
const MAX_EXTRA_PAGES = 4;

// Same-origin link text that tends to carry offer/ICP signal.
const HIGH_SIGNAL_PATHS = [
  "about", "service", "solution", "product", "pricing",
  "industries", "customers", "case-stud", "work", "team", "contact",
];

/** True for IP literals in loopback/private/link-local ranges (v4 + v6). */
function isPrivateAddress(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  // IPv4 literal
  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;       // link-local
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
    return false;
  }

  // IPv6 loopback / unique-local (fc00::/7) / link-local (fe80::/10)
  if (h === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true;

  return false;
}

/** Normalize + validate a user-supplied URL; throws ScrapeError on anything unsafe. */
function safeUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new ScrapeError("Please enter a website URL.", "invalid_url");

  // Reject explicit non-http(s) schemes BEFORE the https:// prepend below
  // would mangle them into a bogus hostname (e.g. ftp://x → https://ftp//x).
  const scheme = trimmed.match(/^([a-z][a-z0-9+.-]*):\/\//i)?.[1]?.toLowerCase();
  if (scheme && scheme !== "http" && scheme !== "https") {
    throw new ScrapeError("Only http and https URLs are supported.", "invalid_url");
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new ScrapeError("That doesn't look like a valid URL.", "invalid_url");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    isPrivateAddress(host)
  ) {
    throw new ScrapeError("That URL points to a private or local address.", "blocked_url");
  }

  return url;
}

/**
 * Resolve `host` and reject if ANY resolved address is private/loopback.
 *
 * The string-level checks in `safeUrl` can't stop a public hostname that
 * resolves to an internal IP (DNS rebinding) — this closes that gap by checking
 * the actual A/AAAA records before we connect.
 */
async function assertPublicHost(host: string): Promise<void> {
  const cleaned = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (isPrivateAddress(cleaned)) {
    throw new ScrapeError("That URL points to a private or local address.", "blocked_url");
  }
  let records: Array<{ address: string }>;
  try {
    records = await lookup(cleaned, { all: true });
  } catch {
    throw new ScrapeError("We couldn't reach that website. Check the URL and try again.", "unreachable");
  }
  for (const r of records) {
    if (isPrivateAddress(r.address)) {
      throw new ScrapeError("That URL resolves to a private or local address.", "blocked_url");
    }
  }
}

/** Fetch one URL with the shared caps; returns raw HTML or throws ScrapeError. */
async function fetchHtml(startUrl: URL): Promise<string> {
  // Follow redirects manually so every hop is re-validated against SSRF — a
  // public page that 302s to http://169.254.169.254/ (cloud metadata) or an
  // internal host must not be followed blindly.
  let url = startUrl;
  let res: Response | undefined;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    try {
      res = await fetch(url.toString(), {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { "User-Agent": FETCH_UA },
      });
    } catch {
      throw new ScrapeError("We couldn't reach that website. Check the URL and try again.", "unreachable");
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) break;
      let next: URL;
      try {
        next = new URL(loc, url);
      } catch {
        throw new ScrapeError("That website returned an invalid redirect.", "unreachable");
      }
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new ScrapeError("That website redirected to an unsupported address.", "blocked_url");
      }
      url = next;
      continue;
    }
    break;
  }

  if (!res) {
    throw new ScrapeError("We couldn't reach that website. Check the URL and try again.", "unreachable");
  }
  if (res.status >= 300 && res.status < 400) {
    throw new ScrapeError("That website redirected too many times.", "unreachable");
  }
  if (!res.ok) {
    throw new ScrapeError(`That website returned an error (HTTP ${res.status}).`, "unreachable");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new ScrapeError("That URL isn't an HTML web page.", "not_html");
  }

  // Cap body read so a huge page can't blow up memory.
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return text.slice(0, MAX_BODY_BYTES);
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BODY_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }
  reader.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(concat(chunks)).slice(0, MAX_BODY_BYTES);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/** Strip HTML to readable text: drop non-content blocks, tags, decode entities. */
function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

function extractTag(html: string, re: RegExp): string {
  const m = html.match(re);
  return m?.[1] ? decodeEntities(m[1].trim()) : "";
}

/** Same-origin high-signal hrefs from homepage HTML, deduped, capped. */
function collectInternalLinks(html: string, origin: URL): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const hrefRe = /href\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    let target: URL;
    try {
      target = new URL(m[1], origin);
    } catch {
      continue;
    }
    if (target.origin !== origin.origin) continue;
    const path = target.pathname.toLowerCase();
    if (path === "/" || path === "") continue;
    if (!HIGH_SIGNAL_PATHS.some((p) => path.includes(p))) continue;
    const key = target.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(target.toString());
    if (out.length >= MAX_EXTRA_PAGES) break;
  }
  return out;
}

export async function scrapeWebsiteForProfile(
  url: string
): Promise<{ pages: { url: string; text: string }[]; finalUrl: string }> {
  const validated = safeUrl(url);
  const homeHtml = await fetchHtml(validated);

  const title = extractTag(homeHtml, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDesc = extractTag(
    homeHtml,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );

  const meta = [title && `Title: ${title}`, metaDesc && `Description: ${metaDesc}`]
    .filter(Boolean)
    .join("\n");
  const homeText = `${meta ? meta + "\n\n" : ""}${htmlToText(homeHtml)}`.slice(0, MAX_PAGE_CHARS);

  const pages: { url: string; text: string }[] = [
    { url: validated.toString(), text: homeText },
  ];
  let totalChars = homeText.length;

  const links = collectInternalLinks(homeHtml, validated);
  // Individual sub-page failures are non-fatal — the homepage alone is usable.
  const results = await Promise.allSettled(links.map((l) => fetchHtml(new URL(l))));
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "fulfilled") continue;
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const text = htmlToText(r.value).slice(0, MAX_PAGE_CHARS);
    if (!text) continue;
    const remaining = MAX_TOTAL_CHARS - totalChars;
    const clipped = text.slice(0, remaining);
    pages.push({ url: links[i], text: clipped });
    totalChars += clipped.length;
  }

  return { pages, finalUrl: validated.toString() };
}
