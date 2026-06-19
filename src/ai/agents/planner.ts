/**
 * Planner agent — turns a natural-language lead request into either clarifying
 * questions or a resolved plan (actor + params + criteria IR). Runs on centralized
 * Gemini (planner task model). See plan §4 + §B.
 */
import type { LLMClient } from "@/ai/llm";
import { CLAUDE_MODELS } from "@/ai/config";
import { actorCatalogForPlanner } from "@/ai/actors/registry";
import type { PlannerDecision, ResolvedPlan, ClarifyQuestion, Predicate } from "@/ai/criteria/types";

const MAX_RESULTS_CEILING = 500;

export interface PlannerProfile {
  companyName: string;
  serviceOffered: string;
  icpDescription?: string;
  businessDetails?: string;
  targetGeographies?: string[];
  targetIndustries?: string[];
}

export interface PlannerInput {
  rawQuery: string;
  clarifications?: Array<{ question: string; answer: string }>;
  /** How many clarification rounds have already happened (cap at 2). */
  round?: number;
  profile: PlannerProfile;
  /** Target lead count the user asked for — clamps the plan's maxResults. */
  desiredLeads?: number;
}

function buildSystemPrompt(): string {
  return `You are the planning brain of an AI outbound-sales tool. A user describes, in
plain English, the kind of leads they want. You decide whether the request is
specific enough to run, and if so you produce a precise PLAN.

Your lead source is Google Maps (the only source at launch). Every plan uses it —
it finds local/SMB businesses by category + location and returns name, website,
public email/phone, rating, review count, category and city:
${actorCatalogForPlanner()}
After discovery, Gemini reads each business's website (when one exists) and does
all research, qualification, and list-building — so you do NOT need a separate
people/B2B source. For people/role-based requests, target the businesses on Maps
and let the research stage surface the right context.

## How to handle conditions
The user often adds qualitative conditions ("no website", "bad reviews", "running
ads", "looks premium"). Express EACH condition as a predicate and route it to the
cheapest evaluator that can decide it:
- "source"        → put it in the actor params instead (category, location, roles, industries). Do NOT also list these as criteria.
- "attribute"     → computable from actor output: rating, reviewsCount, hasEmail, hasPhone, hasWebsite, companySize, industry, city.
- "signal:website-audit" → website condition. field "websiteStatus", values: none | broken | slow | outdated | ok.
- "judge"         → fuzzy/novel things an AI must judge ("premium vibe", "B2B not B2C"). Use for ANYTHING not covered above.

Each predicate: { field, op, value, evaluator, hard, weight, why, feasible }.
- op ∈ eq,neq,lt,lte,gt,gte,between,in,exists,not_exists,contains,matches
- hard=true means it MUST match (filter); hard=false means nice-to-have (ranking).
- why: one short line the user will see.
- feasible: set false ONLY if you cannot find any reliable way to check it — then ask a clarifying question instead.

## When to ask clarifying questions (status "needs_clarification")
Ask ONLY high-value questions; never interrogate. Trigger when:
- a LOCAL search has no city/area,
- the category/intent is ambiguous ("agencies": marketing? travel? staffing?),
- the request is unbounded with no sensible result cap.
Rules: max 3 questions, prefer single_select/multi_select with concrete options,
every question has a one-line "why". Each question:
{ id, type: text|single_select|multi_select|number, question, options?, required, why }.

## When ready (status "ready") produce a plan:
{ actorKey, leadType, params, criteria[], maxResults, estimatedResults, humanSummary, enrichments }
- params: only the Google Maps fields — search (business category/keywords) and location (city/area), plus maxResults.
- enrichments: { companyContacts, emailVerification, businessLeads, socialEnrichment } — turn on ONLY what the request needs. For email outreach keep companyContacts+emailVerification true.
- maxResults: a sane cap (default 200, max ${MAX_RESULTS_CEILING}).
- humanSummary: one plain sentence describing the search + key conditions.

Use the user's business profile to avoid re-asking what you already know.
Respond with STRICT JSON only — no markdown, no commentary.`;
}

function buildUserMessage(input: PlannerInput): string {
  const p = input.profile;
  const lines = [
    `User request: "${input.rawQuery}"`,
    ``,
    `Business profile:`,
    `- Company: ${p.companyName}`,
    `- Sells: ${p.serviceOffered}`,
    p.icpDescription ? `- ICP: ${p.icpDescription}` : "",
    p.businessDetails ? `- Details: ${p.businessDetails}` : "",
    p.targetGeographies?.length ? `- Usual geographies: ${p.targetGeographies.join(", ")}` : "",
    p.targetIndustries?.length ? `- Usual industries: ${p.targetIndustries.join(", ")}` : "",
  ].filter(Boolean);

  if (input.clarifications?.length) {
    lines.push("", "Answers already provided:");
    for (const c of input.clarifications) lines.push(`- ${c.question} → ${c.answer}`);
  }
  if ((input.round ?? 0) >= 2) {
    lines.push("", "You have already asked enough rounds — you MUST return status 'ready' now, filling sensible defaults and surfacing them in the plan for the user to edit.");
  }
  return lines.join("\n");
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : (text.match(/\{[\s\S]*\}/)?.[0] ?? "");
  if (!raw) throw new Error("Planner: no JSON in response");
  return JSON.parse(raw);
}

function coerceQuestions(arr: unknown): ClarifyQuestion[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 3).map((q, i) => {
    const o = (q ?? {}) as Record<string, unknown>;
    const type = ["text", "single_select", "multi_select", "number"].includes(String(o.type))
      ? (o.type as ClarifyQuestion["type"])
      : "text";
    return {
      id: String(o.id ?? `q${i + 1}`),
      type,
      question: String(o.question ?? ""),
      options: Array.isArray(o.options) ? (o.options as unknown[]).map(String) : undefined,
      required: o.required !== false,
      why: String(o.why ?? ""),
    };
  }).filter((q) => q.question);
}

function coercePlan(obj: Record<string, unknown>): ResolvedPlan {
  // Launch is locked to a single actor — Google Maps. Ignore any actorKey the LLM
  // emits and always route discovery through Maps.
  const actorKey = "google_maps" as const;
  const leadType = "LOCAL" as const;
  const params = (obj.params && typeof obj.params === "object" ? obj.params : {}) as Record<string, unknown>;
  const rawMax = Number(obj.maxResults ?? params.maxResults ?? 200);
  const maxResults = Math.max(5, Math.min(Number.isFinite(rawMax) ? rawMax : 200, MAX_RESULTS_CEILING));
  params.maxResults = maxResults;

  const criteria: Predicate[] = Array.isArray(obj.criteria)
    ? (obj.criteria as unknown[]).map((c) => {
        const o = (c ?? {}) as Record<string, unknown>;
        return {
          field: String(o.field ?? ""),
          op: String(o.op ?? "eq") as Predicate["op"],
          value: o.value,
          evaluator: String(o.evaluator ?? "judge") as Predicate["evaluator"],
          hard: o.hard !== false,
          weight: typeof o.weight === "number" ? o.weight : undefined,
          why: String(o.why ?? ""),
          feasible: o.feasible !== false,
        } as Predicate;
      }).filter((c) => c.field)
    : [];

  const enr = (obj.enrichments && typeof obj.enrichments === "object" ? obj.enrichments : {}) as Record<string, unknown>;
  return {
    actorKey,
    leadType,
    params,
    criteria,
    maxResults,
    estimatedResults: Math.min(Number(obj.estimatedResults ?? maxResults) || maxResults, maxResults),
    humanSummary: String(obj.humanSummary ?? "Search for leads."),
    enrichments: {
      companyContacts: enr.companyContacts !== false,
      emailVerification: enr.emailVerification === true,
      businessLeads: enr.businessLeads === true,
      socialEnrichment: enr.socialEnrichment === true,
    },
  };
}

export async function runPlanner(client: LLMClient, input: PlannerInput): Promise<PlannerDecision> {
  const response = await client.messages.create({
    model: CLAUDE_MODELS.smart, // ignored by Gemini client (uses its task model)
    max_tokens: 2048,
    temperature: 0,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  const parsed = extractJson(text) as Record<string, unknown>;

  if (parsed.status === "needs_clarification" && (input.round ?? 0) < 2) {
    const questions = coerceQuestions(parsed.questions);
    if (questions.length) return { status: "needs_clarification", questions };
  }
  // ready (or forced ready after the round cap)
  const planObj = (parsed.plan && typeof parsed.plan === "object" ? parsed.plan : parsed) as Record<string, unknown>;
  const plan = coercePlan(planObj);

  // Honor the user's requested lead count deterministically (don't trust the LLM
  // to respect it). Clamp to the same [5, ceiling] bounds the plan uses.
  if (typeof input.desiredLeads === "number" && Number.isFinite(input.desiredLeads)) {
    const want = Math.max(5, Math.min(Math.round(input.desiredLeads), MAX_RESULTS_CEILING));
    plan.maxResults = want;
    plan.params.maxResults = want;
    plan.estimatedResults = want;
  }

  return { status: "ready", plan };
}
