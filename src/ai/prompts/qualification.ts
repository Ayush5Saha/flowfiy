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
  /** What the platform user's service does (from BusinessProfile.serviceOffered) */
  serviceOffered?: string;
  /** Pain points the service solves (from BusinessProfile.painPointsSolved) */
  painPointsSolved?: string;
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
  const truncatedService = (input.serviceOffered ?? "").slice(0, INPUT_LIMITS.serviceOffered);
  const truncatedPains = (input.painPointsSolved ?? "").slice(0, INPUT_LIMITS.painPointsSolved);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  // Service context block — only added when serviceOffered is provided
  const serviceContext = truncatedService
    ? `\n## Our Service\n${truncatedService}${truncatedPains ? `\n\n## Problems We Solve\n${truncatedPains}` : ""}\n`
    : "";

  const systemPrompt = `You are a B2B sales qualification specialist. Score leads based on ICP fit using the criteria below.

## ICP Summary
${truncatedIcp}

## Qualification Criteria
${truncatedCriteria}
${serviceContext}
## How to score (IMPORTANT)
Every lead you see has ALREADY passed upstream filters: it matches the target
industry and location and has a valid email and a working website. So treat it
as a baseline fit and score it 65-80 by default. Only score below 60
(disqualify) when there is a CLEAR, specific disqualifier — e.g. the company is
plainly in the wrong industry, or obviously the wrong size for the ICP.
Do NOT disqualify a lead just because the Company Analysis is sparse, generic,
or empty — many real sites limit what can be scraped, and thin analysis is NOT
a disqualifier. When in doubt, qualify.

## Task
Return a JSON object.${c ? " Stay within the character limits shown." : " Be specific and detailed in each field."}

\`\`\`json
{
  "score": 0-100,
  "qualified": true/false,
  "primaryReason": "${c ? `≤${L.primaryReason} chars` : "clear explanation of fit or misfit"}",
  "bestAngle": "${c ? `≤${L.bestAngle} chars` : "best outreach angle for this lead"}",
  "painPointMatch": "${c ? `≤${L.painPointMatch} chars` : "how the service addresses their pain point"}",
  "personalizationHooks": ["2-3 hooks${c ? `, each ≤${L.personalizationHook} chars` : " specific to this lead and company"}"],
  "serviceGaps": ["2-4 specific gaps THIS company has that our service directly solves${c ? `, each ≤${L.serviceGap} chars` : ""}. Only include if serviceOffered context was provided."]
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
