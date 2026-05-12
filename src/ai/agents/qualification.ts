import Anthropic from "@anthropic-ai/sdk";
import { buildQualificationPrompt, type QualificationInput } from "@/ai/prompts/qualification";

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
  input: QualificationInput
): Promise<QualificationResult> {
  const prompt = buildQualificationPrompt(input);

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Qualification: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as QualificationResult;
}
