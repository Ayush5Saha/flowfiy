import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { LEAD_GEN_TOOLS } from "./tools/definitions";
import { executeLeadGenTool, type ToolContext } from "./tools/handlers";

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

export interface OrchestratorInput {
  businessProfile: BusinessProfileInput;
  leadsPerRun: number;
  calendlyLink?: string;
}

export interface OrchestratorResult {
  totalLeads: number;
  qualifiedLeads: number;
  toolCallCount: number;
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(input: OrchestratorInput): string {
  const { businessProfile: bp, leadsPerRun, calendlyLink } = input;

  return `You are an autonomous B2B sales intelligence agent for ${bp.companyName}.

## YOUR MISSION
Find ${leadsPerRun} leads, qualify each one, and generate personalised outreach copy for qualified leads.
You have three tools: search_leads, scrape_website, and save_lead_result.

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

## STEP-BY-STEP WORKFLOW

### Step 1 — Search for leads
Call search_leads once with optimised Apollo filters derived from the ICP above.
- Pick 3–6 job titles that match the ICP decision-maker
- Use industry keywords that map to the target industries
- Set company size ranges that match the ICP
- Request exactly ${leadsPerRun} leads

### Step 2 — Gather intelligence (for each lead)
For each lead that has a company website, call scrape_website to gather context.
Skip scraping if: no URL, or you already have strong context from Apollo data.

### Step 3 — Qualify & save each lead
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
- Always call search_leads first before anything else
- Call save_lead_result for every lead returned — no lead left unprocessed
- Do not call search_leads more than once
- Finish only after all leads are saved`;
}

// ─── Agentic loop ─────────────────────────────────────────────────────────────

export async function runLeadGenOrchestrator(
  claude: Anthropic,
  ctx: ToolContext,
  input: OrchestratorInput
): Promise<OrchestratorResult> {
  const systemPrompt = buildSystemPrompt(input);

  const messages: MessageParam[] = [
    {
      role: "user",
      content: `Start the lead generation workflow now. Find ${input.leadsPerRun} leads for ${input.businessProfile.companyName} and process every one of them.`,
    },
  ];

  let toolCallCount = 0;
  const MAX_ITERATIONS = 150; // safety ceiling — prevents runaway loops

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: systemPrompt,
      tools: LEAD_GEN_TOOLS,
      messages,
    });

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
      const toolResults: ToolResultBlockParam[] = await Promise.all(
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
  };
}
