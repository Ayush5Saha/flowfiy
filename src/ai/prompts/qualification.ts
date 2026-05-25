import { INPUT_LIMITS, FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

export interface QualificationInput {
  lead: {
    firstName?: string;
    lastName?: string;
    title?: string;
    companyName?: string;
    companySize?: string;
    industry?: string;
  };
  companyAnalysis: Record<string, unknown>;
  icpSummary: string;
  qualificationCriteria: string;
}

export interface SplitPrompt {
  systemPrompt: string;
  userContent: string;
}

/**
 * Returns a split prompt for prompt caching:
 *   systemPrompt — static instructions + ICP summary + criteria + output schema
 *                  (same for every lead in a run → cacheable)
 *   userContent  — lead data + company analysis (changes per lead → never cached)
 */
export function buildQualificationPrompt(input: QualificationInput, mode: RunMode = "CENTRAL"): SplitPrompt {
  // Compact serialization (no pretty-print) + truncation to keep input tokens fixed
  const companyAnalysisJson = JSON.stringify(input.companyAnalysis).slice(0, INPUT_LIMITS.companyAnalysisJson);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const truncatedCriteria = input.qualificationCriteria.slice(0, INPUT_LIMITS.qualificationCriteria);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  const systemPrompt = `You are a B2B sales qualification specialist. Score leads based on ICP fit using the criteria below.

## ICP Summary
${truncatedIcp}

## Qualification Criteria
${truncatedCriteria}

## Task
Return a JSON object.${c ? " Stay within the character limits shown." : " Be specific and detailed in each field."}

\`\`\`json
{
  "score": 0-100,
  "qualified": true/false,
  "primaryReason": "${c ? `≤${L.primaryReason} chars` : "clear explanation of fit or misfit"}",
  "bestAngle": "${c ? `≤${L.bestAngle} chars` : "best outreach angle for this lead"}",
  "painPointMatch": "${c ? `≤${L.painPointMatch} chars` : "how the service addresses their pain point"}",
  "personalizationHooks": ["2-3 hooks${c ? `, each ≤${L.personalizationHook} chars` : " specific to this lead and company"}"]
}
\`\`\`

Score 60+ = qualified. Return ONLY the JSON.`;

  const userContent = `## Lead
Name: ${input.lead.firstName} ${input.lead.lastName}
Title: ${input.lead.title ?? "Unknown"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? "Unknown"}
Company Size: ${input.lead.companySize ?? "Unknown"}

## Company Analysis
${companyAnalysisJson}`;

  return { systemPrompt, userContent };
}
