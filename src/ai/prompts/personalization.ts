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
- Subject line: Max 7 words. Curiosity or insight-driven. No generic subjects.
- Email body: 4-6 sentences max. Open with insight about THEM, not about us.
- No "I hope this email finds you well." No "My name is X and I work at Y."
- End with a soft CTA. ${calendlyText}
- Follow-up 1: Different angle. 3 sentences. Reference no response. Send 3 days later.
- Follow-up 2: Final break-up email. 2 sentences. Graceful exit + value statement.

Return ONLY a JSON object:

\`\`\`json
{
  "subjectLine": "...",
  "emailBody": "...",
  "followUp1": "...",
  "followUp2": "..."
}
\`\`\``;
}
