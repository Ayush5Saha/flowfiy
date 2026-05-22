import { FIELD_CHAR_LIMITS } from "@/ai/config";

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

export function buildPersonalizationPrompt(input: PersonalizationInput): string {
  const toneGuidance = {
    professional: "Formal but warm. No slang. Clear and direct.",
    conversational: "Casual and human. Short sentences. Like a peer reaching out.",
    direct: "Extremely concise. No fluff. Get to the point in 2 sentences max.",
  }[input.businessProfile.outreachTone] ?? "Professional and clear.";

  const hooks = input.personalizationHooks.join(", ");
  const calendlyText = input.calendlyLink
    ? `Include a booking link: ${input.calendlyLink}`
    : "Ask for a 15-minute call.";

  const L = FIELD_CHAR_LIMITS;

  return `You are an expert cold email copywriter. Write highly personalized B2B outreach for this specific lead.

## About the Sender
Company: ${input.businessProfile.companyName}
Service: ${input.businessProfile.serviceOffered}
Positioning: ${input.businessProfile.offerPositioning}
Tone: ${toneGuidance}

## Lead Profile
Name: ${input.lead.firstName ?? "there"}
Title: ${input.lead.title ?? "Decision Maker"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? ""}

## Outreach Strategy
Best Angle: ${input.bestAngle}
Pain Point: ${input.painPointMatch}
Personalization Hooks: ${hooks}

## Requirements
- Subject line: Max 7 words. Curiosity or insight-driven. No generic subjects. Hard limit: ${L.subjectLine} chars.
- Email body: 4-5 sentences. Open with insight about THEM, not about us. Hard limit: ${L.emailBody} chars.
- No "I hope this email finds you well." No "My name is X and I work at Y."
- End with a soft CTA. ${calendlyText}
- Follow-up 1 (3 days later): Different angle. 3 sentences. Reference no response. Add new value. Hard limit: ${L.followUp1} chars.
- Follow-up 2 (7 days later): Shift the frame. 2 sentences. Ask a genuine question or share a quick insight. Hard limit: ${L.followUp2} chars.
- Follow-up 3 (14 days later): Final graceful exit. 2 sentences. Close the loop, leave the door open. Hard limit: ${L.followUp3} chars.

IMPORTANT: All 6 fields are REQUIRED. Each MUST stay within its character limit. Shorter is better.

Return ONLY a JSON object:

\`\`\`json
{
  "subjectLine": "≤${L.subjectLine} chars",
  "emailBody": "≤${L.emailBody} chars",
  "followUp1": "≤${L.followUp1} chars",
  "followUp2": "≤${L.followUp2} chars",
  "followUp3": "≤${L.followUp3} chars"
}
\`\`\``;
}
