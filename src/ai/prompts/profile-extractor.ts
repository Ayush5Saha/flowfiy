import type { SplitPrompt } from "@/ai/prompts/company-analyzer";
import { ICP_QUESTIONS } from "@/lib/icp";

export interface ProfileExtractorInput {
  pages: { url: string; text: string }[];
  finalUrl: string;
}

const INDUSTRY_HINTS =
  "SaaS, E-commerce, Marketing Agency, Consulting, Fintech, HealthTech, Real Estate, Legal, Education, Manufacturing, Retail, Media & Content, HR & Recruiting, Logistics, Other";
const GEO_HINTS =
  "United States, United Kingdom, Canada, Australia, India, Germany, France, Singapore, UAE, Global";

/** Per-question allowed options + the JSON shape, generated from the single ICP source. */
function icpOptionSpec(): string {
  return ICP_QUESTIONS.map((q) => {
    const card = q.multi ? (q.required ? "choose 1 or more" : "choose 0 or more") : "choose exactly 1";
    return `- ${q.key} (${card}): ${q.options.map((o) => `"${o}"`).join(", ")}`;
  }).join("\n");
}
function icpSchemaLines(): string {
  return ICP_QUESTIONS.map((q) =>
    q.multi
      ? `    "${q.key}": ["one or more of the allowed options"]`
      : `    "${q.key}": "one of the allowed options"`
  ).join(",\n");
}

/**
 * Split prompt for the onboarding website → business-profile draft.
 * systemPrompt holds the static schema/instructions; userContent holds the
 * scraped page text (which changes per site).
 *
 * The model returns TWO things: the free-text business profile (what they sell /
 * who they serve) AND a structured `icp` object whose values are constrained to the
 * onboarding question options — so onboarding can pre-fill every step. Where the site
 * doesn't state an ICP field outright, the model REASONS from the offer to fill it.
 */
export function buildProfileExtractorPrompt(input: ProfileExtractorInput): SplitPrompt {
  const systemPrompt = `You are a B2B go-to-market analyst. Read the scraped content from a company's own website and infer (1) a draft business profile describing what THEY sell, and (2) a structured ICP — the ideal CUSTOMER they should target.

## Rules
- Respond ONLY with a single \`\`\`json code block. No prose before or after.
- Never invent specifics (numbers, names, claims) that aren't supported by the text.
- The ICP is the company's ideal CUSTOMER — infer it from who the site speaks to, testimonials, case studies, and named industries. It is NOT a description of the company itself.
- For a thin, parked, under-construction, or non-business site, set confidence ≤ 0.3 and explain in warnings.
- For any field you had to guess or default, add a short note to warnings.

## Structured ICP — choose ONLY from the allowed options (exact strings)
For each field below pick from its list. Where the website doesn't say outright (e.g. the ideal
decision maker, deal size, or qualification strictness), REASON from what they sell, who they serve,
and their positioning to choose the most probable option(s). Never leave a REQUIRED field empty —
make your best inference. Use the exact option strings; do not invent new values.

${icpOptionSpec()}

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
  "icp": {
${icpSchemaLines()}
  },
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
