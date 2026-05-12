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

\`\`\`json
{
  "buyerPersonas": ["array of 2-3 specific job titles most likely to be the decision maker"],
  "qualifyingSignals": ["array of 5-7 observable signals that indicate a company is a strong fit"],
  "disqualifyingSignals": ["array of 3-5 signals that indicate poor fit"],
  "apolloSearchFilters": {
    "jobTitles": ["job titles for Apollo people search"],
    "industries": ["industry categories matching Apollo's taxonomy"],
    "companySizes": ["employee count ranges, e.g. '1,10' '11,50'"]
  },
  "outreachAngles": ["array of 3 distinct messaging angles ranked by effectiveness"],
  "qualificationCriteria": "A paragraph describing how to score leads 0-100"
}
\`\`\`

Return ONLY the JSON. No explanation.`;
}
