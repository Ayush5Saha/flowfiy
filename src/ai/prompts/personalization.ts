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

  const senderCompany = input.businessProfile.companyName;

  const systemPrompt = `You are an expert cold email copywriter. Write a complete, professional, personalized B2B outreach email for the lead provided. It must read like a thoughtful human wrote it — not a marketing blast.

## About the Sender (you are writing AS this company)
Company: ${senderCompany}
Service: ${input.businessProfile.serviceOffered}
Positioning: ${input.businessProfile.offerPositioning}
Tone: ${toneGuidance}

## How to write the EMAIL BODY — write a COMPLETE email, not a paragraph
Structure it with real line breaks (use \\n), exactly like this:

Hi <lead first name>,

<1-2 sentences: a specific, genuine observation about THEIR company or role. About them, not us.>

<1-2 sentences: the concrete value you offer, tied to their likely pain point. Plain and specific — no hype.>

<1 short sentence: a low-friction call to action. ${calendlyText}>

Best regards,
${senderCompany}

## Hard rules for the body
- ALWAYS open with "Hi <first name>," on its own line, then a blank line.
- ALWAYS end with "Best regards," then "${senderCompany}" on the next line.
- Keep the whole email under ~110 words. Short paragraphs separated by blank lines.
- NO buzzwords, hype, hashtags, or jargon (e.g. "bypass legacy middlemen", "synergy", "leverage", "#LIVACTIVE", "game-changer"). Write plainly.
- NO "I hope this email finds you well." NO "My name is X and I work at Y."
- Subject line: 4-7 words, specific and curiosity-driven, no clickbait.${c ? ` Hard limit: ${L.subjectLine} chars.` : ""}

## Follow-ups (sent in the same thread, so keep them short and human)
- Each follow-up still opens "Hi <first name>," and ends "Best regards,\\n${senderCompany}".
- Follow-up 1 (day 3): a different, specific angle. 2-3 sentences. Lightly reference the earlier note.${c ? ` Hard limit: ${L.followUp1} chars.` : ""}
- Follow-up 2 (day 7): shift the frame. 1-2 sentences. Ask a genuine question or share one useful insight.${c ? ` Hard limit: ${L.followUp2} chars.` : ""}
- Follow-up 3 (day 14): graceful break-up. 1-2 sentences. Close the loop, leave the door open.${c ? ` Hard limit: ${L.followUp3} chars.` : ""}

IMPORTANT: All 5 fields are REQUIRED and every email/follow-up must include the greeting and the sign-off shown above.${c ? " Stay within each character limit." : ""}

Return ONLY a JSON object (use \\n for line breaks inside the strings):

\`\`\`json
{
  "subjectLine": "${c ? `≤${L.subjectLine} chars` : "specific subject line"}",
  "emailBody": "Hi <first name>,\\n\\n<opener>\\n\\n<value>\\n\\n<cta>\\n\\nBest regards,\\n${senderCompany}",
  "followUp1": "Hi <first name>,\\n\\n<new angle>\\n\\nBest regards,\\n${senderCompany}",
  "followUp2": "Hi <first name>,\\n\\n<reframe>\\n\\nBest regards,\\n${senderCompany}",
  "followUp3": "Hi <first name>,\\n\\n<graceful close>\\n\\nBest regards,\\n${senderCompany}"
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
