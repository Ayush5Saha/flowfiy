import { INPUT_LIMITS, FIELD_CHAR_LIMITS, type RunMode } from "@/ai/config";

export interface QualificationInput {
  lead: {
    firstName?: string;
    lastName?: string;
    title?: string;
    companyName?: string;
    companySize?: string;
    industry?: string;
  };
  companyAnalysis: Record<string, unknown>;
  icpSummary: string;
  qualificationCriteria: string;
  /** What the platform user's service does (from BusinessProfile.serviceOffered) */
  serviceOffered?: string;
  /** Pain points the service solves (from BusinessProfile.painPointsSolved) */
  painPointsSolved?: string;
  /** NL pipeline: one-line summary of what THIS search asked for (plan.humanSummary). */
  requestSummary?: string;
  /** NL pipeline: the JUDGE-tier conditions the planner left for the LLM to assess
   *  (deterministic attribute/signal conditions are already applied in discovery). */
  requestConditions?: string;
}

export interface SplitPrompt {
  systemPrompt: string;
  userContent: string;
}

/**
 * Returns a split prompt for prompt caching:
 *   systemPrompt — static instructions + scoring rule + output schema
 *                  (same for every lead in a run → cacheable)
 *   userContent  — lead data + company analysis (changes per lead → never cached)
 *
 * Two scoring modes:
 *   - NL request present  → score ONLY against the user's explicit search; the
 *     business already passed the search's hard filters in discovery, and the org
 *     ICP must NOT be used to disqualify (the user asked for this kind of business).
 *   - No request (legacy) → score against the org ICP baseline.
 */
export function buildQualificationPrompt(input: QualificationInput, mode: RunMode = "CENTRAL"): SplitPrompt {
  // Compact serialization (no pretty-print) + truncation to keep input tokens fixed
  const companyAnalysisJson = JSON.stringify(input.companyAnalysis).slice(0, INPUT_LIMITS.companyAnalysisJson);
  const truncatedIcp = input.icpSummary.slice(0, INPUT_LIMITS.icpSummary);
  const truncatedCriteria = input.qualificationCriteria.slice(0, INPUT_LIMITS.qualificationCriteria);
  const truncatedService = (input.serviceOffered ?? "").slice(0, INPUT_LIMITS.serviceOffered);
  const truncatedPains = (input.painPointsSolved ?? "").slice(0, INPUT_LIMITS.painPointsSolved);
  const L = FIELD_CHAR_LIMITS;
  const c = mode === "CENTRAL";

  // Service context — used for personalization hooks/gaps only, never for scoring.
  const serviceContext = truncatedService
    ? `\n## Our Service (the sender's offer — use only for hooks/gaps, never to disqualify)\n${truncatedService}${truncatedPains ? `\n\n## Problems We Solve\n${truncatedPains}` : ""}\n`
    : "";

  const jsonSchema = `\`\`\`json
{
  "score": 0-100,
  "qualified": true/false,
  "primaryReason": "${c ? `≤${L.primaryReason} chars` : "clear explanation of fit or misfit"}",
  "bestAngle": "${c ? `≤${L.bestAngle} chars` : "best outreach angle for this lead"}",
  "painPointMatch": "${c ? `≤${L.painPointMatch} chars` : "how the service addresses their pain point"}",
  "personalizationHooks": ["2-3 hooks${c ? `, each ≤${L.personalizationHook} chars` : " specific to this lead and company"}"],
  "serviceGaps": ["2-4 specific gaps THIS company has that our service directly solves${c ? `, each ≤${L.serviceGap} chars` : ""}. Only include if serviceOffered context was provided."]
}
\`\`\``;

  const taskBlock = `## Task
Return a JSON object.${c ? " Stay within the character limits shown." : " Be specific and detailed in each field."}

${jsonSchema}

Score 60+ = qualified. Return ONLY the JSON.`;

  const hasRequest = !!(
    (input.requestSummary && input.requestSummary.trim()) ||
    (input.requestConditions && input.requestConditions.trim())
  );

  let systemPrompt: string;
  if (hasRequest) {
    // ── NL pipeline: score ONLY against the user's explicit search ────────────
    const conds = input.requestConditions && input.requestConditions.trim()
      ? `Remaining conditions to judge from the data below:\n${input.requestConditions}`
      : `No extra conditions to judge — the search's filters (business category, location, and conditions like "no website") were already verified during discovery.`;
    systemPrompt = `You are a lead qualification specialist. The user ran a SPECIFIC search; score how well THIS lead matches what they asked for — nothing else.

## What the user searched for (score against THIS)
${input.requestSummary ? `Request: ${input.requestSummary}\n` : ""}${conds}
${serviceContext}
## How to score (IMPORTANT)
This lead ALREADY passed the search's hard filters during discovery, so it IS the
kind of business the user asked for. Score only the remaining conditions above:
- No remaining conditions, or all clearly met → score 80-95 (qualified).
- A "MUST match" condition that clearly FAILS → score 30 or below (disqualify).
- A condition you cannot confirm from the data but is plausible → lean toward met.
  Thin or empty Company Analysis is NOT a disqualifier.
NEVER disqualify because the business is "not a B2B service provider" or "not our
usual ICP" — the user EXPLICITLY searched for this kind of business, so that is
NOT a valid reason to score low. Do not re-check conditions already verified in
discovery (e.g. "has no website") — assume they hold.

${taskBlock}`;
  } else {
    // ── Legacy / ICP-driven scoring ───────────────────────────────────────────
    systemPrompt = `You are a B2B sales qualification specialist. Score leads based on how well they match the ICP below.

## ICP Summary
${truncatedIcp}

## Qualification Criteria
${truncatedCriteria}
${serviceContext}
## How to score (IMPORTANT)
Every lead you see has ALREADY passed upstream filters: it matches the target
industry and location and has a valid email and a working website. So treat it
as a baseline fit and score it 65-80 by default. Only score below 60
(disqualify) when there is a CLEAR, specific disqualifier — e.g. the company is
plainly in the wrong industry, or obviously the wrong size for the ICP.
Do NOT disqualify a lead just because the Company Analysis is sparse, generic,
or empty — many real sites limit what can be scraped, and thin analysis is NOT
a disqualifier. When in doubt, qualify.

${taskBlock}`;
  }

  const userContent = `## Lead
Name: ${input.lead.firstName} ${input.lead.lastName}
Title: ${input.lead.title ?? "Unknown"}
Company: ${input.lead.companyName}
Industry: ${input.lead.industry ?? "Unknown"}
Company Size: ${input.lead.companySize ?? "Unknown"}

## Company Analysis
${companyAnalysisJson}`;

  return { systemPrompt, userContent };
}
