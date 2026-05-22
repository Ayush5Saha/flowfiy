import { INPUT_LIMITS, FIELD_CHAR_LIMITS } from "@/ai/config";

export interface CompanyAnalyzerInput {
  companyName: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  websiteContent: string;
  icpSummary: string;
}

export function buildCompanyAnalyzerPrompt(input: CompanyAnalyzerInput): string {
  // Hard input truncation — keeps token cost predictable regardless of scraped content size
  const truncatedContent = input.websiteContent.slice(0, INPUT_LIMITS.websiteContent);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const L = FIELD_CHAR_LIMITS;

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
Produce a JSON object. Strict character limits — stay within them.

\`\`\`json
{
  "brandMaturity": "emerging|established|enterprise",
  "marketingQuality": "weak|moderate|strong",
  "acquisitionGaps": ["2-4 weaknesses, each ≤${L.acquisitionGap} chars"],
  "growthBottlenecks": ["2-3 constraints, each ≤${L.growthBottleneck} chars"],
  "techStack": ["tools only, each ≤${L.techStackItem} chars"],
  "recentSignals": ["signals only, each ≤${L.recentSignal} chars"],
  "fitAssessment": "2-sentence assessment ≤${L.fitAssessment} chars",
  "bestOutreachAngle": "Single best angle ≤${L.bestOutreachAngle} chars",
  "confidence": 0-100
}
\`\`\`

Return ONLY the JSON. No explanation.`;
}
