import Anthropic from "@anthropic-ai/sdk";
import { buildCompanyAnalyzerPrompt, type CompanyAnalyzerInput } from "@/ai/prompts/company-analyzer";

export interface CompanyAnalysis {
  brandMaturity: "emerging" | "established" | "enterprise";
  marketingQuality: "weak" | "moderate" | "strong";
  acquisitionGaps: string[];
  growthBottlenecks: string[];
  techStack: string[];
  recentSignals: string[];
  fitAssessment: string;
  bestOutreachAngle: string;
  confidence: number;
}

export async function runCompanyAnalyzer(
  client: Anthropic,
  input: CompanyAnalyzerInput
): Promise<CompanyAnalysis> {
  const prompt = buildCompanyAnalyzerPrompt(input);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("CompanyAnalyzer: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as CompanyAnalysis;
}
