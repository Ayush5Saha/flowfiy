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

export function buildQualificationPrompt(input: QualificationInput, mode: RunMode = "CENTRAL"): string {
  // Compact serialization (no pretty-print) + truncation to keep input tokens fixed
  const companyAnalysisJson = JSON.stringify(input.companyAnalysis).slice(0, INPUT_LIMITS.companyAnalysisJson);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const truncatedCriteria = input.qualificationCriteria.slice(0, INPUT_LIMITS.qualificationCriteria);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

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

Score 70+ = qualified. Return ONLY the JSON.`;
}
