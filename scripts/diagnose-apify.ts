/* Live Apify diagnostic — runs each lead actor with the user's REAL key + ICP and
 * dumps: which actors 403/fail, how many leads each returns, the RAW output field
 * names (to catch parser mismatches), and how many survive the email filter.
 *
 *   npx tsx scripts/diagnose-apify.ts
 */
import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BASE = "https://api.apify.com/v2";

async function runActor(actor: string, input: object, token: string, maxItems = 10) {
  const url = `${BASE}/acts/${actor}/run-sync-get-dataset-items?token=${token}&maxItems=${maxItems}&maxTotalChargeUsd=0.5`;
  try {
    const r = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input), signal: AbortSignal.timeout(120_000),
    });
    const text = await r.text();
    let json: unknown = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, ok: r.ok, json, text: text.slice(0, 300) };
  } catch (e) {
    return { status: 0, ok: false, json: null, text: e instanceof Error ? e.message : String(e) };
  }
}

function summarize(label: string, res: Awaited<ReturnType<typeof runActor>>) {
  console.log(`\n━━━ ${label} ━━━`);
  console.log(`HTTP ${res.status}`);
  if (!res.ok) { console.log("FAILED:", res.text); return; }
  const arr = Array.isArray(res.json) ? res.json as Record<string, unknown>[] : [];
  console.log(`rows returned: ${arr.length}`);
  if (arr.length) {
    console.log("first row KEYS:", Object.keys(arr[0]).join(", "));
    const f = arr[0];
    console.log("first row sample:", JSON.stringify(f).slice(0, 400));
    // detect emails across common field names
    const emailFields = ["email", "personal_email", "primaryEmail", "emails", "work_email"];
    let withEmail = 0;
    for (const row of arr) {
      const vals = emailFields.flatMap((k) => {
        const v = (row as Record<string, unknown>)[k];
        return Array.isArray(v) ? v : [v];
      });
      if (vals.some((v) => typeof v === "string" && EMAIL_RE.test(v))) withEmail++;
    }
    console.log(`rows with a valid email (any common field): ${withEmail}/${arr.length}`);
  }
}

(async () => {
  const integ = await prisma.integration.findFirst({
    where: { type: "APIFY", status: "CONNECTED" },
    select: { organizationId: true, encryptedCredentials: true },
  });
  if (!integ) { console.log("No CONNECTED Apify integration found in DB."); process.exit(0); }
  const token = decryptCredentials(integ.encryptedCredentials).apiKey as string;
  console.log("Apify key:", token ? token.slice(0, 8) + "…(" + token.length + " chars)" : "MISSING");

  const bp = await prisma.businessProfile.findUnique({ where: { organizationId: integ.organizationId } });
  const icp = (bp?.icpAnalysisCache as { apolloSearchFilters?: { jobTitles?: string[]; industries?: string[] } } | null)?.apolloSearchFilters;
  const jobTitles = icp?.jobTitles?.length ? icp.jobTitles : ["Chief Marketing Officer", "Head of Business Development"];
  const industries = (icp?.industries?.length ? icp.industries : bp?.targetIndustries) ?? ["SaaS"];
  const geos = bp?.targetGeographies ?? ["United States"];
  console.log("ICP titles:", jobTitles.slice(0, 6).join(", "));
  console.log("ICP industries:", industries.join(", "));
  console.log("ICP geographies:", geos.join(", "));

  // account / plan check
  const me = await fetch(`${BASE}/users/me?token=${token}`).then((r) => r.json()).catch(() => null) as { data?: { plan?: { id?: string } } } | null;
  console.log("\nApify plan:", me?.data?.plan?.id ?? "unknown");

  // 1) nexgen (free-plan person-level) — the workhorse for free plans
  summarize("nexgendata/b2b-leads-finder", await runActor("nexgendata~b2b-leads-finder", {
    jobTitle: jobTitles[0], industry: industries[0], location: geos[0], maxResults: 10,
  }, token));

  // 2) code_crafter/leads-finder (paid/needs approval)
  summarize("code_crafter/leads-finder", await runActor("code_crafter~leads-finder", {
    contact_job_title: jobTitles.slice(0, 5), fetch_count: 10, email_status: ["validated"],
  }, token));

  // 3) Google Maps places (local-SMB; needs business-type terms)
  summarize("compass/crawler-google-places", await runActor("compass~crawler-google-places", {
    searchStringsArray: [`${industries[0]} in ${geos[0]}`], maxCrawledPlacesPerSearch: 10,
    scrapeContacts: true, skipClosedPlaces: true, language: "en",
  }, token));

  console.log("\nDone — share this output and I'll fix parsing/ordering accordingly.");
  process.exit(0);
})().catch((e) => { console.error("FATAL:", e instanceof Error ? e.message : e); process.exit(1); });
