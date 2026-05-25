import { FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

export interface PersonalizationInput {
  lead: {
    firstName?: string;
    lastName?: string;
    title?: string;
    companyName?: string;
    industry?: string;
  };
  businessProfile: {
    companyName: string;
    serviceOffered: string;
    offerPositioning: string;
    outreachTone: string;
  };
  bestAngle: string;
  painPointMatch: string;
  personalizationHooks: string[];
  calendlyLink?: string;
}

export interface SplitPrompt {
  systemPrompt: string;
  userContent: string;
}

/**
 * Returns a split prompt for prompt caching:
 *   systemPrompt — static instructions + sender business profile + tone + requirements + schema
 *                  (same for every lead in a run → cacheable)
 *   userContent  — lead profile + outreach strategy (changes per lead → never cached)
 */
export function buildPersonalizationPrompt(input: PersonalizationInput, mode: RunMode = "CENTRAL"): SplitPrompt {
  const toneGuidance = {
    professional: "Formal but warm. No slang. Clear and direct.",
    conversational: "Casual and human. Short sentences. Like a peer reaching out.",
    direct: "Extremely concise. No fluff. Get to the point in 2 sentences max.",
  }[input.businessProfile.outreachTone] ?? "Professional and clear.";

  const calendlyText = input.calendlyLink
    ? `Include a booking link: ${input.calendlyLink}`
    : "Ask for a 15-minute call.";

  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  const systemPrompt = `You are an expert cold email copywriter. Write highly personalized B2B outreach for the lead provided.

## About the Sender
Company: ${input.businessProfile.companyName}
Service: ${input.businessProfile.serviceOffered}
Positioning: ${input.businessProfile.offerPositioning}
Tone: ${toneGuidance}

## Requirements
- Subject line: Max 7 words. Curiosity or insight-driven. No generic subjects.${c ? ` Hard limit: ${L.subjectLine} chars.` : ""}
- Email body: 4-5 sentences. Open with insight about THEM, not about us.${c ? ` Hard limit: ${L.emailBody} chars.` : ""}
- No "I hope this email finds you well." No "My name is X and I work at Y."
- End with a soft CTA. ${calendlyText}
- Follow-up 1 (3 days later): Different angle. 3 sentences. Reference no response. Add new value.${c ? ` Hard limit: ${L.followUp1} chars.` : ""}
- Follow-up 2 (7 days later): Shift the frame. 2 sentences. Ask a genuine question or share a quick insight.${c ? ` Hard limit: ${L.followUp2} chars.` : ""}
- Follow-up 3 (14 days later): Final graceful exit. 2 sentences. Close the loop, leave the door open.${c ? ` Hard limit: ${L.followUp3} chars.` : ""}

IMPORTANT: All 6 fields are REQUIRED.${c ? " Each MUST stay within its character limit. Shorter is better." : " Make each message genuinely compelling and personalized."}

Return ONLY a JSON object:

\`\`\`json
{
  "subjectLine": "${c ? `≤${L.subjectLine} chars` : "compelling subject line"}",
  "emailBody": "${c ? `≤${L.emailBody} chars` : "personalized email body"}",
  "followUp1": "${c ? `≤${L.followUp1} chars` : "first follow-up message"}",
  "followUp2": "${c ? `≤${L.followUp2} chars` : "second follow-up message"}",
  "followUp3": "${c ? `≤${L.followUp3} chars` : "final follow-up message"}"
}
\`\`\``;

  const hooks = input.personalizationHooks.join(", ");

  const userContent = `## Lead Profile
Name: ${input.lead.firstName ?? "there"}
Title: ${input.lead.title ?? "Decision Maker"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? ""}

## Outreach Strategy
Best Angle: ${input.bestAngle}
Pain Point: ${input.painPointMatch}
Personalization Hooks: ${hooks}`;

  return { systemPrompt, userContent };
}
