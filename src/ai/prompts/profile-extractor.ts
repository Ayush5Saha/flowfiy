import type { SplitPrompt } from "@/ai/prompts/company-analyzer";

export interface ProfileExtractorInput {
  pages: { url: string; text: string }[];
  finalUrl: string;
}

const INDUSTRY_HINTS =
  "SaaS, E-commerce, Marketing Agency, Consulting, Fintech, HealthTech, Real Estate, Legal, Education, Manufacturing, Retail, Media & Content, HR & Recruiting, Logistics, Other";
const GEO_HINTS =
  "United States, United Kingdom, Canada, Australia, India, Germany, France, Singapore, UAE, Global";

/**
 * Split prompt for the onboarding website → business-profile draft.
 * systemPrompt holds the static schema/instructions; userContent holds the
 * scraped page text (which changes per site).
 */
export function buildProfileExtractorPrompt(input: ProfileExtractorInput): SplitPrompt {
  const systemPrompt = `You are a B2B go-to-market analyst. Read the scraped content from a company's own website and infer a draft business profile describing what THEY sell and who their ideal CUSTOMER is.

## Rules
- Respond ONLY with a single \`\`\`json code block. No prose before or after.
- Never invent specifics (numbers, names, claims) that aren't supported by the text.
- The ICP is the company's ideal CUSTOMER — infer it from who the site speaks to, testimonials, case studies, and named industries. It is NOT a description of the company itself.
- For a thin, parked, under-construction, or non-business site, set confidence ≤ 0.3 and explain in warnings.
- For any field you had to guess or default, add a short note to warnings.

## Output schema
\`\`\`json
{
  "companyName": "the company's name",
  "serviceOffered": "1-3 sentences on what they sell (≤1000 chars)",
  "icpDescription": "who their ideal customer is (≤2000 chars)",
  "targetIndustries": ["1-5 industries; prefer when applicable: ${INDUSTRY_HINTS}"],
  "targetGeographies": ["1-5; prefer: ${GEO_HINTS}; default [\\"Global\\"] if unknown"],
  "companySizeRange": "one of 1-10|11-50|51-200|201-500|500+ for their TARGET customers, or null",
  "painPointsSolved": "the customer pains they solve (≤1000 chars)",
  "offerPositioning": "their differentiator / guarantee / positioning (≤1000 chars)",
  "outreachTone": "professional|conversational|direct — based on brand voice",
  "confidence": 0.0,
  "warnings": ["notes on fields that are guesses"]
}
\`\`\`

Return ONLY the JSON.`;

  const pagesText = input.pages
    .map((p) => `### ${p.url}\n${p.text}`)
    .join("\n\n");

  const userContent = `Website: ${input.finalUrl}

## Scraped content
${pagesText}`;

  return { systemPrompt, userContent };
}
