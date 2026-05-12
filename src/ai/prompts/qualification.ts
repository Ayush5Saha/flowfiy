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
  return `You are a B2B sales qualification specialist. Score this lead based on ICP fit.

## Lead
Name: ${input.lead.firstName} ${input.lead.lastName}
Title: ${input.lead.title ?? "Unknown"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? "Unknown"}
Company Size: ${input.lead.companySize ?? "Unknown"}

## Company Analysis
${JSON.stringify(input.companyAnalysis, null, 2)}

## ICP Summary
${input.icpSummary}

## Qualification Criteria
${input.qualificationCriteria}

## Task
Return a JSON object:

\`\`\`json
{
  "score": 0-100,
  "qualified": true/false,
  "primaryReason": "One sentence on the top reason for this score",
  "bestAngle": "The specific outreach angle to use for this lead",
  "painPointMatch": "Which pain point from the ICP best matches this company",
  "personalizationHooks": ["2-3 specific facts from their profile to use in outreach"]
}
\`\`\`

Score 70+ = qualified. Return ONLY the JSON.`;
}
