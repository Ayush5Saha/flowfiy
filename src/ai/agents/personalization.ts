import Anthropic from "@anthropic-ai/sdk";
import { buildPersonalizationPrompt, type PersonalizationInput } from "@/ai/prompts/personalization";
import { CLAUDE_MODELS, AGENT_MAX_TOKENS, TEMPERATURE } from "@/ai/config";

export interface PersonalizationResult {
  subjectLine: string;
  emailBody: string;
  followUp1: string;
  followUp2: string;
  followUp3: string;
}

export async function runPersonalization(
  client: Anthropic,
  input: PersonalizationInput
): Promise<PersonalizationResult> {
  const prompt = buildPersonalizationPrompt(input);

  const response = await client.messages.create({
    model: CLAUDE_MODELS.smart,
    max_tokens: AGENT_MAX_TOKENS.personalization,
    temperature: TEMPERATURE,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Personalization: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as PersonalizationResult;
}
