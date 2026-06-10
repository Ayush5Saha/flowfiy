import type { LLMClient } from "@/ai/llm";
import { buildPersonalizationPrompt, type PersonalizationInput } from "@/ai/prompts/personalization";
import { CLAUDE_MODELS, getRunConfig, type RunMode } from "@/ai/config";

export interface PersonalizationResult {
  subjectLine: string;
  emailBody: string;
  followUp1: string;
  followUp2: string;
  followUp3: string;
}

export async function runPersonalization(
  client: LLMClient,
  input: PersonalizationInput,
  mode: RunMode = "CENTRAL"
): Promise<PersonalizationResult> {
  const { systemPrompt, userContent } = buildPersonalizationPrompt(input, mode);
  const cfg = getRunConfig(mode);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.smart,
    max_tokens: cfg.maxTokens.personalization,
    ...(cfg.temperature !== undefined && { temperature: cfg.temperature }),
    system: [
      {
        type: "text",
        text: systemPrompt,
        // Cache sender profile + tone + requirements + schema — same for every lead in a run
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Personalization: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as PersonalizationResult;
}
