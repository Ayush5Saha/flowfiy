import type { LLMClient } from "@/ai/llm";
import { buildCompanyAnalyzerPrompt, type CompanyAnalyzerInput } from "@/ai/prompts/company-analyzer";
import { CLAUDE_MODELS, getRunConfig, type RunMode } from "@/ai/config";

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
  client: LLMClient,
  input: CompanyAnalyzerInput,
  mode: RunMode = "CENTRAL"
): Promise<CompanyAnalysis> {
  const { systemPrompt, userContent } = buildCompanyAnalyzerPrompt(input, mode);
  const cfg = getRunConfig(mode);

  const response = await client.messages.create({
    // Haiku: structured HTML extraction — identical quality at 12× lower cost vs Sonnet
    model: CLAUDE_MODELS.fast,
    max_tokens: cfg.maxTokens.companyAnalyzer,
    ...(cfg.temperature !== undefined && { temperature: cfg.temperature }),
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache ICP context + instructions — same for every lead in a run (5-min TTL)
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("CompanyAnalyzer: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as CompanyAnalysis;
}
