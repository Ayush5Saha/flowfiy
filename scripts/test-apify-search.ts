/* Verify the production ApifyClient.searchPeople returns leads for the real ICP,
 * and how many would survive the new keep-rule (valid email OR LinkedIn).
 *   npx tsx scripts/test-apify-search.ts */
import { readFileSync } from "fs";
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { ApifyClient } from "@/integrations/apify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

(async () => {
  const integ = await prisma.integration.findFirst({ where: { type: "APIFY", status: "CONNECTED" }, select: { organizationId: true, encryptedCredentials: true } });
  if (!integ) { console.log("no Apify integration"); process.exit(0); }
  const key = decryptCredentials(integ.encryptedCredentials).apiKey as string;
  const bp = await prisma.businessProfile.findUnique({ where: { organizationId: integ.organizationId } });
  const icp = (bp?.icpAnalysisCache as { apolloSearchFilters?: { jobTitles?: string[]; industries?: string[] } } | null)?.apolloSearchFilters;
  const jobTitles = icp?.jobTitles ?? ["Head of Business Development"];
  const industries = (icp?.industries?.length ? icp.industries : bp?.targetIndustries) ?? ["E-commerce"];
  const geographies = bp?.targetGeographies ?? ["India"];

  const apify = new ApifyClient(key);
  const leads = await apify.searchPeople({ jobTitles, industries, geographies, limit: 10, round: 1 });
  console.log(`searchPeople returned ${leads.length} lead(s)`);
  const withEmail = leads.filter((l) => EMAIL_RE.test((l.email ?? "").trim().toLowerCase())).length;
  const withLinkedIn = leads.filter((l) => l.linkedinUrl && /linkedin\.com/i.test(l.linkedinUrl)).length;
  const kept = leads.filter((l) => EMAIL_RE.test((l.email ?? "").trim().toLowerCase()) || (l.linkedinUrl && /linkedin\.com/i.test(l.linkedinUrl))).length;
  console.log(`  with email: ${withEmail}  ·  with LinkedIn: ${withLinkedIn}  ·  KEPT by new filter: ${kept} (was ${withEmail} under old filter)`);
  leads.slice(0, 5).forEach((l) => console.log(`  • ${l.firstName} ${l.lastName} — ${l.title ?? "?"} @ ${l.organization?.name ?? l.organization?.industry ?? "?"} — ${l.email ?? "(no email)"} — ${l.linkedinUrl ?? "-"}`));
  process.exit(0);
})().catch((e) => { console.error("FATAL:", e instanceof Error ? e.message : e); process.exit(1); });
