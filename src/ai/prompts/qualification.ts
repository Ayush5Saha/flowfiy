import { INPUT_LIMITS, FIELD_CHAR_LIMITS } from "@/ai/config";

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

export function buildQualificationPrompt(input: QualificationInput): string {
  // Compact serialization (no pretty-print) + truncation to keep input tokens fixed
  const companyAnalysisJson = JSON.stringify(input.companyAnalysis).slice(0, INPUT_LIMITS.companyAnalysisJson);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const truncatedCriteria = input.qualificationCriteria.slice(0, INPUT_LIMITS.qualificationCriteria);
  const L = FIELD_CHAR_LIMITS;

  return `You are a B2B sales qualification specialist. Score this lead based on ICP fit.

## Lead
Name: ${input.lead.firstName} ${input.lead.lastName}
Title: ${input.lead.title ?? "Unknown"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? "Unknown"}
Company Size: ${input.lead.companySize ?? "Unknown"}

## Company Analysis
${companyAnalysisJson}

## ICP Summary
${truncatedIcp}

## Qualification Criteria
${truncatedCriteria}

## Task
Return a JSON object. Stay within the character limits shown.

\`\`\`json
{
  "score": 0-100,
  "qualified": true/false,
  "primaryReason": "≤${L.primaryReason} chars",
  "bestAngle": "≤${L.bestAngle} chars",
  "painPointMatch": "≤${L.painPointMatch} chars",
  "personalizationHooks": ["2-3 hooks, each ≤${L.personalizationHook} chars"]
}
\`\`\`

Score 70+ = qualified. Return ONLY the JSON.`;
}
