import Anthropic from "@anthropic-ai/sdk";
import { buildQualificationPrompt, type QualificationInput } from "@/ai/prompts/qualification";
import { CLAUDE_MODELS, getRunConfig, type RunMode } from "@/ai/config";

export interface QualificationResult {
  score: number;
  qualified: boolean;
  primaryReason: string;
  bestAngle: string;
  painPointMatch: string;
  personalizationHooks: string[];
}

export async function runQualification(
  client: Anthropic,
  input: QualificationInput,
  mode: RunMode = "CENTRAL"
): Promise<QualificationResult> {
  const { systemPrompt, userContent } = buildQualificationPrompt(input, mode);
  const cfg = getRunConfig(mode);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.fast,
    max_tokens: cfg.maxTokens.qualification,
    ...(cfg.temperature !== undefined && { temperature: cfg.temperature }),
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache ICP summary + criteria + schema — same for every lead in a run
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Qualification: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as QualificationResult;
}
