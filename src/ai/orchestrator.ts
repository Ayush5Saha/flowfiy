import { LEAD_GEN_TOOLS } from "./tools/definitions";
import { executeLeadGenTool, type ToolContext } from "./tools/handlers";
import type { RunMode } from "@/ai/config";
import type { LLMClient, LLMMessage } from "@/ai/llm";

// Local shape for tool_result blocks sent back to the model (Anthropic format).
interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessProfileInput {
  companyName: string;
  serviceOffered: string;
  icpDescription: string;
  targetIndustries: string[];
  targetGeographies: string[];
  companySizeRange?: string | null;
  painPointsSolved: string;
  offerPositioning: string;
  outreachTone: string;
}

export interface PreloadedLead {
  leadId: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  email?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  companySize?: string | null;
  industry?: string | null;
}

export interface OrchestratorInput {
  businessProfile: BusinessProfileInput;
  leadsPerRun: number;
  calendlyLink?: string;
  /** Import mode: leads already in DB — skip search_leads entirely */
  preloadedLeads?: PreloadedLead[];
  /**
   * Retry/resume mode: a previous attempt partially completed these leads.
   * Only the RESEARCHING (unfinished) subset is passed here — skip discovery,
   * pick up qualification from where the last run crashed.
   */
  resumeLeads?: PreloadedLead[];
}

export interface OrchestratorResult {
  totalLeads: number;
  qualifiedLeads: number;
  toolCallCount: number;
  tokenUsage: { inputTokens: number; outputTokens: number };
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(input: OrchestratorInput): string {
  const { businessProfile: bp, leadsPerRun, calendlyLink, preloadedLeads, resumeLeads } = input;

  const isImportMode = !!preloadedLeads?.length;
  const isResumeMode = !!resumeLeads?.length;
  const skipDiscovery = isImportMode || isResumeMode;

  const discoverySection = isResumeMode
    ? `## RESUMING FROM CHECKPOINT
A previous run already completed lead discovery. ${resumeLeads!.length} leads still need qualification.
These leads are listed in the initial user message with their exact leadIds.
DO NOT call search_leads — start directly at Step 2 (scrape + qualify each lead).`
    : isImportMode
    ? `## LEADS ARE ALREADY PROVIDED
The user has uploaded a CSV. All ${leadsPerRun} leads are listed in the initial user message with their exact leadIds.
DO NOT call search_leads — it is not available. Start directly from Step 2.`
    : `## STEP 1 — Search for leads
Call search_leads once with optimised Apollo filters derived from the ICP above.
- Pick 3–6 job titles that match the ICP decision-maker
- Use industry keywords that map to the target industries
- Set company size ranges that match the ICP
- Request exactly ${leadsPerRun} leads`;

  const leadCount = isResumeMode ? resumeLeads!.length : leadsPerRun;

  return `You are an autonomous B2B sales intelligence agent for ${bp.companyName}.

## YOUR MISSION
Process ${leadCount} leads, qualify each one, and generate personalised outreach copy for qualified leads.
You have ${skipDiscovery ? "two" : "three"} tools: ${skipDiscovery ? "" : "search_leads, "}scrape_website, and save_lead_result.

## BUSINESS CONTEXT
- Company: ${bp.companyName}
- Service/Product: ${bp.serviceOffered}
- Ideal Customer Profile: ${bp.icpDescription}
- Target Industries: ${bp.targetIndustries.join(", ")}
- Target Geographies: ${bp.targetGeographies.join(", ")}
- Company Size Range: ${bp.companySizeRange ?? "Any"}
- Pain Points Solved: ${bp.painPointsSolved}
- Offer Positioning: ${bp.offerPositioning}
- Outreach Tone: ${bp.outreachTone}
${calendlyLink ? `- Booking Link: ${calendlyLink}` : ""}

${discoverySection}

## STEP 2 — Gather intelligence (for each lead)
For each lead that has a company website, call scrape_website to gather context.
Skip scraping if: no URL, or you already have strong context from the lead data.

## STEP 3 — Qualify & save each lead
Call save_lead_result for EVERY lead. Never skip a lead.
- Score 0–100 based on ICP fit (title relevance, company size, industry match, pain point signals)
- Leads scoring >= 60 are QUALIFIED
- For QUALIFIED leads: write subject line, email body, 2 follow-ups
  ${calendlyLink ? `- Always include the booking link: ${calendlyLink}` : ""}
  - Email tone: ${bp.outreachTone}
  - Keep subject under 60 chars
  - Body: 3–5 short paras (personalised hook → pain point → value prop → CTA)
  - Follow-up 1: shorter, adds a new angle
  - Follow-up 2: short "break-up" style
- For DISQUALIFIED leads: set qualified=false, still provide score and bestAngle

## RULES
${skipDiscovery ? "- DO NOT call search_leads — leads are pre-loaded, use the leadIds from the user message\n" : "- Always call search_leads first before anything else\n- Do not call search_leads more than once\n"}- Call save_lead_result for every lead — no lead left unprocessed
- Finish only after all leads are saved`;
}

// ─── Agentic loop ─────────────────────────────────────────────────────────────

export async function runLeadGenOrchestrator(
  claude: LLMClient,
  ctx: ToolContext,
  input: OrchestratorInput,
  runMode: RunMode = "CENTRAL"
): Promise<OrchestratorResult> {
  void runMode; // reserved for future per-mode orchestrator tuning
  const systemPrompt = buildSystemPrompt(input);

  const isImportMode = !!input.preloadedLeads?.length;
  const isResumeMode = !!input.resumeLeads?.length;
  const skipDiscovery = isImportMode || isResumeMode;

  const activeLeads = isResumeMode ? input.resumeLeads! : input.preloadedLeads;

  const initialUserMessage = isResumeMode
    ? `Resuming from checkpoint. ${input.resumeLeads!.length} leads were discovered in a previous run but not yet qualified. Process every one of them now. Use the exact leadId values when calling save_lead_result.\n\n${JSON.stringify(input.resumeLeads, null, 2)}\n\nDo NOT call search_leads.`
    : isImportMode
    ? `Here are the ${input.preloadedLeads!.length} pre-loaded leads to qualify and generate outreach for. Use the exact leadId values when calling save_lead_result.\n\n${JSON.stringify(input.preloadedLeads, null, 2)}\n\nProcess every lead above. Do NOT call search_leads.`
    : `Start the lead generation workflow now. Find ${input.leadsPerRun} leads for ${input.businessProfile.companyName} and process every one of them.`;

  void activeLeads; // used via skipDiscovery / initialUserMessage above

  const messages: LLMMessage[] = [
    {
      role: "user",
      content: initialUserMessage,
    },
  ];

  let toolCallCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const MAX_ITERATIONS = 150; // safety ceiling — prevents runaway loops

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const tools = skipDiscovery
      ? LEAD_GEN_TOOLS.filter((t) => t.name !== "search_leads")
      : LEAD_GEN_TOOLS;

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      tools,
      messages,
    });

    // Accumulate token usage
    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Append the assistant turn to conversation history
    messages.push({ role: "assistant", content: response.content });

    // Natural end — Claude finished on its own
    if (response.stop_reason === "end_turn") {
      break;
    }

    // Tool use — execute all requested tools in parallel
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      toolCallCount += toolUseBlocks.length;

      // Execute tools in parallel where safe (search_leads is first so sequential is fine;
      // save_lead_result calls are naturally parallel per lead)
      const toolResults: ToolResultBlock[] = await Promise.all(
        toolUseBlocks.map(async (block) => {
          if (block.type !== "tool_use") {
            // Should not happen, but TypeScript needs the guard
            return { type: "tool_result" as const, tool_use_id: "", content: "" };
          }

          try {
            const result = await executeLeadGenTool(
              block.name,
              block.input as Record<string, unknown>,
              ctx
            );
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: JSON.stringify(result),
            };
          } catch (err) {
            console.error(`[orchestrator] Tool '${block.name}' failed:`, err);
            return {
              type: "tool_result" as const,
              tool_use_id: block.id,
              content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
              is_error: true,
            };
          }
        })
      );

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // max_tokens hit or unexpected stop — break out safely
    console.warn(`[orchestrator] Unexpected stop_reason: ${response.stop_reason}`);
    break;
  }

  return {
    totalLeads: ctx.stats.totalLeads,
    qualifiedLeads: ctx.stats.qualifiedLeads,
    toolCallCount,
    tokenUsage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
  };
}
