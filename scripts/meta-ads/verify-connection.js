/* Meta Marketing API — connection verifier.
 * Confirms the token + ad account + page are wired up correctly BEFORE we build
 * any campaigns. Reads creds from .env.local. NEVER prints the token/secret.
 *
 * Usage:  node scripts/meta-ads/verify-connection.js
 */
"use strict";
const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// ── load .env.local (only vars not already in the environment) ──────────────
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;
const PAGE_ID = process.env.META_PAGE_ID;
const APP_SECRET = process.env.META_APP_SECRET;
const V = process.env.META_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;

function fail(msg) {
  console.error("✖ " + msg);
  process.exitCode = 1;
}

// appsecret_proof hardens the call when an app secret is provided (recommended).
function proof() {
  if (!APP_SECRET || !TOKEN) return null;
  return crypto.createHmac("sha256", APP_SECRET).update(TOKEN).digest("hex");
}

async function graph(p, fields) {
  const u = new URL(`${BASE}/${p}`);
  u.searchParams.set("access_token", TOKEN);
  if (fields) u.searchParams.set("fields", fields);
  const pr = proof();
  if (pr) u.searchParams.set("appsecret_proof", pr);
  const res = await fetch(u, { signal: AbortSignal.timeout(20000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(`${e.message || res.statusText} (code ${e.code ?? res.status}${e.error_subcode ? "/" + e.error_subcode : ""})`);
  }
  return json;
}

(async () => {
  console.log(`Meta Marketing API check — ${V}\n`);

  // Required creds present?
  const missing = [
    ["META_ACCESS_TOKEN", TOKEN],
    ["META_AD_ACCOUNT_ID", AD_ACCOUNT],
    ["META_PAGE_ID", PAGE_ID],
  ].filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    return fail(`Missing in .env.local: ${missing.join(", ")}`);
  }
  if (!/^act_\d+$/.test(AD_ACCOUNT)) {
    return fail(`META_AD_ACCOUNT_ID must look like act_1234567890 (got "${AD_ACCOUNT}")`);
  }

  // 1) Token identity + scopes
  try {
    const me = await graph("me", "id,name");
    console.log(`✔ Token valid — identity: ${me.name || me.id}`);
    const perms = await graph("me/permissions");
    const granted = (perms.data || []).filter((p) => p.status === "granted").map((p) => p.permission);
    const need = ["ads_management", "ads_read"];
    const have = need.filter((n) => granted.includes(n));
    const lack = need.filter((n) => !granted.includes(n));
    console.log(`  scopes granted: ${granted.join(", ") || "(none reported — common for system-user tokens)"}`);
    if (lack.length && granted.length) console.log(`  ⚠ missing scope(s): ${lack.join(", ")}`);
    void have;
  } catch (e) {
    return fail(`Token check failed: ${e.message}`);
  }

  // 2) Ad account access + status + funding
  try {
    const acct = await graph(AD_ACCOUNT, "name,account_status,currency,timezone_name,amount_spent,balance,funding_source");
    const statusMap = { 1: "ACTIVE", 2: "DISABLED", 3: "UNSETTLED", 7: "PENDING_RISK_REVIEW", 9: "IN_GRACE_PERIOD", 101: "CLOSED" };
    console.log(`\n✔ Ad account: ${acct.name}`);
    console.log(`  status: ${statusMap[acct.account_status] || acct.account_status}  ·  currency: ${acct.currency}  ·  tz: ${acct.timezone_name}`);
    if (acct.account_status !== 1) console.log(`  ⚠ account is not ACTIVE — add a payment method / resolve review before ads can spend.`);
    if (!acct.funding_source) console.log(`  ⚠ no funding source detected — add a payment method in Ads Manager.`);
  } catch (e) {
    return fail(`Ad account access failed: ${e.message}  — is the account assigned to this system user with ads_management?`);
  }

  // 3) Page access (ads must reference a Page)
  try {
    const page = await graph(PAGE_ID, "name,category,is_published");
    console.log(`\n✔ Page: ${page.name} (${page.category})${page.is_published === false ? " ⚠ not published" : ""}`);
  } catch (e) {
    return fail(`Page access failed: ${e.message} — assign the Page to the system user too.`);
  }

  // 4) Can we read campaigns? (read-only probe — creates nothing)
  try {
    const camps = await graph(`${AD_ACCOUNT}/campaigns`, "name,status,objective");
    console.log(`\n✔ Campaign read OK — ${(camps.data || []).length} existing campaign(s).`);
  } catch (e) {
    return fail(`Campaign read failed: ${e.message}`);
  }

  if (!APP_SECRET) console.log(`\nℹ Tip: set META_APP_SECRET to enable appsecret_proof (hardens API calls).`);
  console.log(`\n✅ Connection verified — ready to build campaigns (created PAUSED for your approval).`);
})().catch((e) => fail(e.message));
