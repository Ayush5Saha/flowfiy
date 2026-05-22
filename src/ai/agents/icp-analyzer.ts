import Anthropic from "@anthropic-ai/sdk";
import { buildICPAnalyzerPrompt, type ICPAnalyzerInput } from "@/ai/prompts/icp-analyzer";
import { CLAUDE_MODELS, AGENT_MAX_TOKENS, TEMPERATURE } from "@/ai/config";

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
  input: ICPAnalyzerInput
): Promise<ICPAnalysis> {
  const prompt = buildICPAnalyzerPrompt(input);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.fast,
    max_tokens: AGENT_MAX_TOKENS.icpAnalyzer,
    temperature: TEMPERATURE,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ICPAnalyzer: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as ICPAnalysis;
}
