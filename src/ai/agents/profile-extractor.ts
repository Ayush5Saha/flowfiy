import type { LLMClient } from "@/ai/llm";
import { buildProfileExtractorPrompt, type ProfileExtractorInput } from "@/ai/prompts/profile-extractor";
import { CLAUDE_MODELS } from "@/ai/config";

export interface ProfileDraft {
  companyName: string;
  serviceOffered: string;
  icpDescription: string;
  targetIndustries: string[];
  targetGeographies: string[];
  companySizeRange: "1-10" | "11-50" | "51-200" | "201-500" | "500+" | null;
  painPointsSolved: string;
  offerPositioning: string;
  outreachTone: "professional" | "conversational" | "direct";
  /** Structured ICP answers (option strings), for pre-filling onboarding. Validated in the route. */
  icp?: Record<string, unknown>;
  confidence: number;
  warnings: string[];
}

export async function runProfileExtractor(
  client: LLMClient,
  input: ProfileExtractorInput
): Promise<ProfileDraft> {
  const { systemPrompt, userContent } = buildProfileExtractorPrompt(input);

  const response = await client.messages.create({
    // Structured extraction from scraped HTML text. The concrete model is chosen by
    // the caller's client (central Gemini in prod); this id is only a fallback for
    // an Anthropic client and is ignored by the Gemini/OpenRouter adapters.
    model: CLAUDE_MODELS.fast,
    max_tokens: 2048, // legacy profile fields + the structured ICP object
    temperature: 0,
    system: [{ type: "text", text: systemPrompt }],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("ProfileExtractor: no JSON in response");

  return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as ProfileDraft;
}
