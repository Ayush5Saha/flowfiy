import { INPUT_LIMITS, FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

export interface CompanyAnalyzerInput {
  companyName: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  websiteContent: string;
  icpSummary: string;
}

export function buildCompanyAnalyzerPrompt(input: CompanyAnalyzerInput, mode: RunMode = "CENTRAL"): string {
  // Hard input truncation — keeps token cost predictable regardless of scraped content size
  const truncatedContent = input.websiteContent.slice(0, INPUT_LIMITS.websiteContent);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  return `You are a B2B sales intelligence analyst. Analyze this company and produce a structured intelligence report.

## Company
Name: ${input.companyName}
Website: ${input.companyWebsite}
Industry: ${input.industry}
Size: ${input.companySize ?? "Unknown"}

## ICP Context
${truncatedIcp}

## Website Content (scraped)
${truncatedContent}

## Analysis Required
Produce a JSON object.${c ? " Strict character limits — stay within them." : " Be thorough and detailed."}

\`\`\`json
{
  "brandMaturity": "emerging|established|enterprise",
  "marketingQuality": "weak|moderate|strong",
  "acquisitionGaps": ["2-4 weaknesses${c ? `, each ≤${L.acquisitionGap} chars` : ""}"],
  "growthBottlenecks": ["2-3 constraints${c ? `, each ≤${L.growthBottleneck} chars` : ""}"],
  "techStack": ["tools only${c ? `, each ≤${L.techStackItem} chars` : ""}"],
  "recentSignals": ["signals only${c ? `, each ≤${L.recentSignal} chars` : ""}"],
  "fitAssessment": "2-sentence assessment${c ? ` ≤${L.fitAssessment} chars` : ""}",
  "bestOutreachAngle": "Single best angle${c ? ` ≤${L.bestOutreachAngle} chars` : ""}",
  "confidence": 0-100
}
\`\`\`

Return ONLY the JSON. No explanation.`;
}
