import { INPUT_LIMITS, FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

export interface CompanyAnalyzerInput {
  companyName: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  websiteContent: string;
  icpSummary: string;
}

export interface SplitPrompt {
  systemPrompt: string;
  userContent: string;
}

/**
 * Returns a split prompt for prompt caching:
 *   systemPrompt — static instructions + ICP context + output schema
 *                  (same for every lead in a run → cacheable)
 *   userContent  — company-specific data (name, website, scraped content)
 *                  (changes per lead → never cached)
 */
export function buildCompanyAnalyzerPrompt(input: CompanyAnalyzerInput, mode: RunMode = "CENTRAL"): SplitPrompt {
  // Hard input truncation — keeps token cost predictable regardless of scraped content size
  const truncatedContent = input.websiteContent.slice(0, INPUT_LIMITS.websiteContent);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  const systemPrompt = `You are a B2B sales intelligence analyst. Analyze the company provided and produce a structured intelligence report.

## ICP Context
${truncatedIcp}

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

  const userContent = `## Company
Name: ${input.companyName}
Website: ${input.companyWebsite}
Industry: ${input.industry}
Size: ${input.companySize ?? "Unknown"}

## Website Content (scraped)
${truncatedContent}`;

  return { systemPrompt, userContent };
}
