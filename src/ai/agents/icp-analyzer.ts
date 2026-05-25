import Anthropic from "@anthropic-ai/sdk";
import { buildICPAnalyzerPrompt, type ICPAnalyzerInput } from "@/ai/prompts/icp-analyzer";
import { CLAUDE_MODELS, getRunConfig, type RunMode } from "@/ai/config";

export interface ICPAnalysis {
  buyerPersonas: string[];
  qualifyingSignals: string[];
  disqualifyingSignals: string[];
  apolloSearchFilters: {
    jobTitles: string[];
    industries: string[];
    companySizes: string[];
  };
  outreachAngles: string[];
  qualificationCriteria: string;
}

export async function runICPAnalyzer(
  client: Anthropic,
  input: ICPAnalyzerInput,
  mode: RunMode = "CENTRAL"
): Promise<ICPAnalysis> {
  const { systemPrompt, userContent } = buildICPAnalyzerPrompt(input, mode);
  const cfg = getRunConfig(mode);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.fast,
    max_tokens: cfg.maxTokens.icpAnalyzer,
    ...(cfg.temperature !== undefined && { temperature: cfg.temperature }),
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache static instructions + schema — same per org, saves repeated input token cost
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ICPAnalyzer: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as ICPAnalysis;
}
