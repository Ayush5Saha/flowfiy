import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { decryptCredentials } from "@/lib/encryption";
import { getClaudeClient } from "@/ai/client";
import { runICPAnalyzer } from "@/ai/agents/icp-analyzer";
import { runCompanyAnalyzer } from "@/ai/agents/company-analyzer";
import { runQualification } from "@/ai/agents/qualification";
import { runPersonalization } from "@/ai/agents/personalization";
import { ApolloClient } from "@/integrations/apollo";
import { ApifyClient } from "@/integrations/apify";
import { incrementGenerationCount } from "@/lib/usage";

export interface LeadGenerationJobData {
  organizationId: string;
  leadListId: string;
  leadsPerRun: number;
  mode?: "apollo" | "import"; // "import" = leads already in DB, skip Apollo discovery
}

async function getIntegrationCredentials(organizationId: string, type: string) {
  const integration = await prisma.integration.findUnique({
    where: { organizationId_type: { organizationId, type: type as never } },
    select: { encryptedCredentials: true, status: true },
  });
  if (!integration || integration.status !== "CONNECTED") return null;
  return decryptCredentials(integration.encryptedCredentials);
}

export async function processLeadGeneration(job: Job<LeadGenerationJobData>) {
  const { organizationId, leadListId, leadsPerRun, mode = "apollo" } = job.data;

  async function updateListStatus(status: string, extra?: Record<string, unknown>) {
    await prisma.leadList.update({
      where: { id: leadListId },
      data: { status: status as never, ...extra },
    });
  }

  try {
    // ── Step 1: Load business profile ────────────────────────────────────────
    await updateListStatus("RESEARCHING", { jobStatus: "analyzing_icp" });

    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId },
    });
    if (!businessProfile) throw new Error("Business profile not configured");

    // ── Step 2: Run ICP Analyzer ──────────────────────────────────────────────
    const claude = await getClaudeClient(organizationId);
    const icpAnalysis = await runICPAnalyzer(claude, {
      companyName: businessProfile.companyName,
      serviceOffered: businessProfile.serviceOffered,
      icpDescription: businessProfile.icpDescription,
      targetIndustries: businessProfile.targetIndustries,
      targetGeographies: businessProfile.targetGeographies,
      companySizeRange: businessProfile.companySizeRange ?? undefined,
      painPointsSolved: businessProfile.painPointsSolved,
      offerPositioning: businessProfile.offerPositioning,
      outreachTone: businessProfile.outreachTone,
    });

    await prisma.businessProfile.update({
      where: { organizationId },
      data: { icpAnalysisCache: icpAnalysis as never },
    });

    let createdLeads: Awaited<ReturnType<typeof prisma.lead.create>>[];

    if (mode === "import") {
      // ── Import mode: leads already in DB, skip Apollo ─────────────────────
      await updateListStatus("RESEARCHING", { jobStatus: "analyzing_companies" });

      createdLeads = await prisma.lead.findMany({
        where: { leadListId, organizationId },
      });

      if (createdLeads.length === 0) {
        await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
        return;
      }

      // Mark all as RESEARCHING
      await prisma.lead.updateMany({
        where: { leadListId, organizationId },
        data: { status: "RESEARCHING" },
      });
    } else {
      // ── Apollo mode: discover leads ───────────────────────────────────────
      await updateListStatus("RESEARCHING", { jobStatus: "discovering_leads" });

      const apolloCreds = await getIntegrationCredentials(organizationId, "APOLLO");
      if (!apolloCreds?.apiKey) throw new Error("Apollo API key not connected");

      const apolloClient = new ApolloClient(apolloCreds.apiKey);
      const rawLeads = await apolloClient.searchPeople({
        jobTitles: icpAnalysis.apolloSearchFilters.jobTitles,
        industries: icpAnalysis.apolloSearchFilters.industries,
        companySizes: icpAnalysis.apolloSearchFilters.companySizes,
        geographies: businessProfile.targetGeographies,
        perPage: leadsPerRun,
      });

      if (rawLeads.length === 0) {
        await updateListStatus("READY", { jobStatus: "complete", totalLeads: 0 });
        return;
      }

      createdLeads = await Promise.all(
        rawLeads.map((raw) =>
          prisma.lead.create({
            data: {
              leadListId,
              organizationId,
              firstName: raw.firstName,
              lastName: raw.lastName,
              email: raw.email,
              title: raw.title,
              companyName: raw.organization?.name,
              companyWebsite: raw.organization?.websiteUrl,
              companySize: raw.organization?.employeeCount?.toString(),
              industry: raw.organization?.industry,
              linkedinUrl: raw.linkedinUrl,
              source: "apollo",
              rawData: raw as never,
              status: "RESEARCHING",
            },
          })
        )
      );

      await updateListStatus("RESEARCHING", {
        jobStatus: "analyzing_companies",
        totalLeads: createdLeads.length,
      });
    }

    // ── Step 5: Company Analysis + Qualification (parallel, batched) ──────────
    const apifyCreds = await getIntegrationCredentials(organizationId, "APIFY");
    const apifyClient = apifyCreds?.apiKey ? new ApifyClient(apifyCreds.apiKey) : null;

    const calendlyCreds = await getIntegrationCredentials(organizationId, "CALENDLY");
    const icpSummaryText = JSON.stringify(icpAnalysis);

    const BATCH_SIZE = 5;
    let qualifiedCount = 0;

    for (let i = 0; i < createdLeads.length; i += BATCH_SIZE) {
      const batch = createdLeads.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (lead) => {
          try {
            // Scrape company website
            let websiteContent = "";
            if (apifyClient && lead.companyWebsite) {
              try {
                websiteContent = await apifyClient.scrapeWebsite(lead.companyWebsite);
              } catch {
                websiteContent = "";
              }
            }

            // Company analysis
            const companyAnalysis = await runCompanyAnalyzer(claude, {
              companyName: lead.companyName ?? "",
              companyWebsite: lead.companyWebsite ?? "",
              industry: lead.industry ?? "",
              companySize: lead.companySize ?? undefined,
              websiteContent,
              icpSummary: icpSummaryText,
            });

            // Qualification
            const qualification = await runQualification(claude, {
              lead: {
                firstName: lead.firstName ?? undefined,
                lastName: lead.lastName ?? undefined,
                title: lead.title ?? undefined,
                companyName: lead.companyName ?? undefined,
                companySize: lead.companySize ?? undefined,
                industry: lead.industry ?? undefined,
              },
              companyAnalysis: companyAnalysis as never,
              icpSummary: icpSummaryText,
              qualificationCriteria: icpAnalysis.qualificationCriteria,
            });

            // Save research
            await prisma.leadResearch.create({
              data: {
                leadId: lead.id,
                organizationId,
                companyAnalysis: companyAnalysis as never,
                opportunityAngle: qualification.bestAngle,
                painPointMatch: qualification.painPointMatch,
                personalizationNotes: qualification.personalizationHooks.join("; "),
                researchMetadata: { confidence: companyAnalysis.confidence } as never,
              },
            });

            const newStatus = qualification.qualified ? "QUALIFIED" : "DISQUALIFIED";

            if (qualification.qualified) {
              qualifiedCount++;

              // Generate personalized outreach
              const outreach = await runPersonalization(claude, {
                lead: {
                  firstName: lead.firstName ?? undefined,
                  lastName: lead.lastName ?? undefined,
                  title: lead.title ?? undefined,
                  companyName: lead.companyName ?? undefined,
                  industry: lead.industry ?? undefined,
                },
                businessProfile: {
                  companyName: businessProfile.companyName,
                  serviceOffered: businessProfile.serviceOffered,
                  offerPositioning: businessProfile.offerPositioning,
                  outreachTone: businessProfile.outreachTone,
                },
                bestAngle: qualification.bestAngle,
                painPointMatch: qualification.painPointMatch,
                personalizationHooks: qualification.personalizationHooks,
                calendlyLink: calendlyCreds?.schedulingLink,
              });

              await prisma.outreachCopy.create({
                data: {
                  leadId: lead.id,
                  organizationId,
                  channel: "email",
                  subjectLine: outreach.subjectLine,
                  body: outreach.emailBody,
                  followUp1: outreach.followUp1,
                  followUp2: outreach.followUp2,
                },
              });
            }

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                status: newStatus,
                qualificationScore: qualification.score,
              },
            });
          } catch (err) {
            console.error(`[worker] Failed to process lead ${lead.id}:`, err);
            await prisma.lead.update({
              where: { id: lead.id },
              data: { status: "DISQUALIFIED" },
            });
          }
        })
      );
    }

    // ── Step 6: Finalize ──────────────────────────────────────────────────────
    await incrementGenerationCount(organizationId, createdLeads.length);

    await prisma.leadList.update({
      where: { id: leadListId },
      data: {
        status: "READY",
        jobStatus: "complete",
        totalLeads: createdLeads.length,
        qualifiedLeads: qualifiedCount,
      },
    });
  } catch (err) {
    await prisma.leadList.update({
      where: { id: leadListId },
      data: {
        status: "FAILED",
        jobStatus: "failed",
        jobError: err instanceof Error ? err.message : "Unknown error",
      },
    });
    throw err;
  }
}
