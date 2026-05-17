import type { Tool } from "@anthropic-ai/sdk/resources/messages";

/**
 * Tools exposed to Claude's agentic orchestrator.
 *
 * Claude autonomously decides when and how to call each tool,
 * based on the business profile and ICP instructions in the system prompt.
 *
 * Flow Claude follows:
 *   1. search_leads  → discover prospects via Apollo
 *   2. scrape_website (optional) → gather company intelligence via Apify
 *   3. save_lead_result → persist qualification decision + outreach copy to DB
 */
export const LEAD_GEN_TOOLS: Tool[] = [
  // ─── 1. LEAD DISCOVERY ──────────────────────────────────────────────────────
  {
    name: "search_leads",
    description:
      "Search for B2B leads using Apollo.io. Pass ICP-derived filters. " +
      "Returns a list of people with their company info and internal lead IDs " +
      "you will need when calling save_lead_result.",
    input_schema: {
      type: "object" as const,
      properties: {
        jobTitles: {
          type: "array",
          items: { type: "string" },
          description: "Decision-maker job titles to target (e.g. 'Head of Sales', 'Founder', 'VP Marketing').",
        },
        industries: {
          type: "array",
          items: { type: "string" },
          description: "Industry keywords to filter by (e.g. 'SaaS', 'E-commerce', 'FinTech').",
        },
        companySizes: {
          type: "array",
          items: { type: "string" },
          description: "Apollo employee-count range strings (e.g. '1,10', '11,50', '51,200', '201,500').",
        },
        geographies: {
          type: "array",
          items: { type: "string" },
          description: "Locations to target (e.g. 'United States', 'United Kingdom', 'India').",
        },
        limit: {
          type: "number",
          description: "Number of leads to fetch. Use the leadsPerRun value from your instructions.",
        },
      },
      required: ["jobTitles", "industries", "companySizes"],
    },
  },

  // ─── 2. COMPANY INTELLIGENCE ────────────────────────────────────────────────
  {
    name: "scrape_website",
    description:
      "Scrape a company website to gather intelligence: products, positioning, tech stack, hiring signals, pain points. " +
      "Use this for leads where you need more context before qualifying. " +
      "Skip if the company URL is missing or you already have enough context.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "Company website URL (e.g. 'https://acme.com').",
        },
        leadId: {
          type: "string",
          description: "The lead ID this scrape is for (for logging purposes).",
        },
      },
      required: ["url"],
    },
  },

  // ─── 3. SAVE RESULT ─────────────────────────────────────────────────────────
  {
    name: "save_lead_result",
    description:
      "Save your qualification decision and outreach copy for a lead. " +
      "Call this for EVERY lead returned by search_leads, whether qualified or not. " +
      "For qualified leads (score >= 60), fill in all email fields. " +
      "For unqualified leads, set qualified=false and leave email fields empty.",
    input_schema: {
      type: "object" as const,
      properties: {
        leadId: {
          type: "string",
          description: "The lead ID from search_leads output.",
        },
        qualified: {
          type: "boolean",
          description: "true if the lead meets ICP criteria (score >= 60), false otherwise.",
        },
        score: {
          type: "number",
          description: "Qualification score 0–100 based on ICP fit.",
        },
        bestAngle: {
          type: "string",
          description: "The single strongest outreach angle for this lead.",
        },
        painPointMatch: {
          type: "string",
          description: "The specific pain point this prospect likely has that your service solves.",
        },
        personalizationHooks: {
          type: "array",
          items: { type: "string" },
          description: "2–4 specific details to personalise the email (from website, title, industry, etc.).",
        },
        // Email fields — required only if qualified=true
        subjectLine: {
          type: "string",
          description: "Email subject line (required if qualified=true). Keep under 60 chars.",
        },
        emailBody: {
          type: "string",
          description:
            "Full email body (required if qualified=true). " +
            "3–5 short paragraphs. Personalised opening, pain point, value prop, CTA with Calendly link if provided.",
        },
        followUp1: {
          type: "string",
          description: "First follow-up email body (required if qualified=true). Shorter, add new value.",
        },
        followUp2: {
          type: "string",
          description: "Second follow-up email body (required if qualified=true). Short break-up style.",
        },
      },
      required: ["leadId", "qualified", "score", "bestAngle", "painPointMatch", "personalizationHooks"],
    },
  },
];
