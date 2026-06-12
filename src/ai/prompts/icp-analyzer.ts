import { FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

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

export interface SplitPrompt {
  systemPrompt: string;
  userContent: string;
}

/**
 * Returns a split prompt for prompt caching:
 *   systemPrompt — static instructions + output schema (cacheable, same per org)
 *   userContent  — business profile data (dynamic per org)
 */
export function buildICPAnalyzerPrompt(input: ICPAnalyzerInput, mode: RunMode = "CENTRAL"): SplitPrompt {
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  const systemPrompt = `You are an expert B2B sales strategist. Turn the business profile below into a structured ICP (Ideal Customer Profile) that DRIVES a people-search and lead qualification. The search filters you produce are fed directly into Apollo/Apify, so they must be broad enough to return a deep pool of matching people — not so narrow that the search returns almost nobody.

## How to build the search filters (READ CAREFULLY)
1. jobTitles → 8-14 titles for a people-search "person_titles" field. Include:
   - the core buyer's exact title AND common variants (e.g. "VP of Sales", "Vice President of Sales", "Head of Sales", "Sales Director", "Director of Sales")
   - adjacent decision-makers who also approve this purchase (e.g. founder/CEO/COO for SMBs, "Chief Revenue Officer", "Head of Growth")
   - seniority variants (Head of / Director of / VP of / Chief … Officer)
   Prefer widely-used, literal titles people actually put on LinkedIn. Avoid niche or invented titles. More good titles = more candidates.
2. industries → 3-6 SHORT industry keywords (e.g. "software", "marketing", "real estate", "e-commerce"). These are matched as free-text keyword tags, so use common single words/short phrases, not long taxonomy strings.
3. companySizes → Apollo employee ranges in "min,max" form. Choose the ranges that fit the ICP from: "1,10","11,50","51,200","201,500","501,1000","1001,5000","5001,10000". If size is unspecified, return a broad set like ["1,10","11,50","51,200","201,500"].

## Task
Produce a JSON object with the structure below. Be specific and actionable.
${c ? "Strict character limits apply — exceed them and the output will be truncated." : "Be thorough and detailed in each field."}

\`\`\`json
{
  "buyerPersonas": ["2-3 specific buyer job titles${c ? `, each ≤${L.buyerPersona} chars` : ""}"],
  "qualifyingSignals": ["5-7 observable signals a company is a good fit${c ? `, each ≤${L.qualifyingSignal} chars` : ""}"],
  "disqualifyingSignals": ["3-5 clear disqualifiers${c ? `, each ≤${L.disqualifyingSignal} chars` : ""}"],
  "apolloSearchFilters": {
    "jobTitles": ["8-14 search titles per the rules above${c ? `, each ≤${L.apolloJobTitle} chars` : ""}"],
    "industries": ["3-6 short industry keywords${c ? `, each ≤${L.apolloIndustry} chars` : ""}"],
    "companySizes": ["employee ranges in 'min,max' form, e.g. '1,10', '11,50'"]
  },
  "outreachAngles": ["3 messaging angles ranked by effectiveness${c ? `, each ≤${L.outreachAngle} chars` : ""}"],
  "qualificationCriteria": "Paragraph on how to score leads 0-100 for fit.${c ? ` ≤${L.qualificationCriteria} chars total.` : ""}"
}
\`\`\`

Return ONLY the JSON. No explanation.`;

  const sizeLine = input.companySizeRange?.trim()
    ? input.companySizeRange
    : "Not specified — infer a sensible broad range from the ICP";

  const userContent = `## Business Profile
[Company]        ${input.companyName}
[Service]        ${input.serviceOffered}
[Who they sell to]
${input.icpDescription}

[Target industries]   ${input.targetIndustries.length ? input.targetIndustries.join(", ") : "Not specified — infer from the service & ICP above"}
[Target geographies]  ${input.targetGeographies.length ? input.targetGeographies.join(", ") : "Not specified"}
[Company size range]  ${sizeLine}

[Pain points solved]
${input.painPointsSolved}

[Offer positioning]   ${input.offerPositioning}
[Outreach tone]       ${input.outreachTone}`;

  return { systemPrompt, userContent };
}
