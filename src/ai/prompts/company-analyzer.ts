export interface CompanyAnalyzerInput {
  companyName: string;
  companyWebsite: string;
  industry: string;
  companySize?: string;
  websiteContent: string;
  icpSummary: string;
}

export function buildCompanyAnalyzerPrompt(input: CompanyAnalyzerInput): string {
  const truncatedContent = input.websiteContent.slice(0, 3000);

  return `You are a B2B sales intelligence analyst. Analyze this company and produce a structured intelligence report.

## Company
Name: ${input.companyName}
Website: ${input.companyWebsite}
Industry: ${input.industry}
Size: ${input.companySize ?? "Unknown"}

## ICP Context
${input.icpSummary}

## Website Content (scraped)
${truncatedContent}

## Analysis Required
Produce a JSON object:

\`\`\`json
{
  "brandMaturity": "emerging|established|enterprise",
  "marketingQuality": "weak|moderate|strong",
  "acquisitionGaps": ["list of 2-4 specific growth/acquisition weaknesses you can identify"],
  "growthBottlenecks": ["list of 2-3 likely growth constraints based on their stage and signals"],
  "techStack": ["any tech tools mentioned or implied"],
  "recentSignals": ["any recent hires, funding, expansion signals from website"],
  "fitAssessment": "A 2-sentence assessment of why this company would or wouldn't benefit from the service",
  "bestOutreachAngle": "The single most compelling angle for outreach based on their profile",
  "confidence": 0-100
}
\`\`\`

Return ONLY the JSON. No explanation.`;
}
