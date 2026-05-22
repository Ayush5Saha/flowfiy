import { FIELD_CHAR_LIMITS } from "@/ai/config";

export interface ICPAnalyzerInput {
  companyName: string;
  serviceOffered: string;
  icpDescription: string;
  targetIndustries: string[];
  targetGeographies: string[];
  companySizeRange?: string;
  painPointsSolved: string;
  offerPositioning: string;
  outreachTone: string;
}

export function buildICPAnalyzerPrompt(input: ICPAnalyzerInput): string {
  const L = FIELD_CHAR_LIMITS;

  return `You are an expert B2B sales strategist. Analyze the following business profile and produce a structured ICP (Ideal Customer Profile) analysis that will be used to guide lead generation and qualification.

## Business Profile
Company: ${input.companyName}
Service: ${input.serviceOffered}
ICP Description: ${input.icpDescription}
Target Industries: ${input.targetIndustries.join(", ")}
Target Geographies: ${input.targetGeographies.join(", ")}
Company Size Range: ${input.companySizeRange ?? "Not specified"}
Pain Points Solved: ${input.painPointsSolved}
Offer Positioning: ${input.offerPositioning}
Outreach Tone: ${input.outreachTone}

## Task
Produce a JSON object with the following structure. Be specific and actionable.
Strict character limits apply — exceed them and the output will be truncated.

\`\`\`json
{
  "buyerPersonas": ["2-3 job titles, each ≤${L.buyerPersona} chars"],
  "qualifyingSignals": ["5-7 observable signals, each ≤${L.qualifyingSignal} chars"],
  "disqualifyingSignals": ["3-5 signals, each ≤${L.disqualifyingSignal} chars"],
  "apolloSearchFilters": {
    "jobTitles": ["job titles for Apollo search, each ≤${L.apolloJobTitle} chars"],
    "industries": ["Apollo taxonomy industries, each ≤${L.apolloIndustry} chars"],
    "companySizes": ["employee ranges e.g. '1,10' '11,50'"]
  },
  "outreachAngles": ["3 messaging angles ranked by effectiveness, each ≤${L.outreachAngle} chars"],
  "qualificationCriteria": "Paragraph on how to score leads 0-100. ≤${L.qualificationCriteria} chars total."
}
\`\`\`

Return ONLY the JSON. No explanation.`;
}
