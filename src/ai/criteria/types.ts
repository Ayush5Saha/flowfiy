/**
 * Criteria IR — the structured form of any qualitative condition a user types.
 *
 * The Planner decomposes a request into Predicates, each routed to the cheapest
 * evaluator that can decide it. Anything not deterministically computable is
 * marked `judge` and assessed by the LLM during qualification. See plan §B.
 */

export type CriteriaOp =
  | "eq" | "neq" | "lt" | "lte" | "gt" | "gte"
  | "between" | "in" | "exists" | "not_exists" | "contains" | "matches";

/**
 * Where a predicate is decided:
 *  - "source"      → pushed into the actor query (free, filters at the API)
 *  - "attribute"   → computed from actor output in memory (free)
 *  - "signal:<id>" → an active probe (website-audit, tech-detect, …) — metered
 *  - "judge"       → LLM judgment over gathered research (fuzzy / novel)
 */
export type Evaluator = "source" | "attribute" | "judge" | `signal:${string}`;

export interface Predicate {
  /** Canonical field key (see criteria/registry) or a free-text label for judge. */
  field: string;
  op: CriteriaOp;
  value?: unknown;
  evaluator: Evaluator;
  /** hard → filter (must match); soft → contributes to the 0–100 score. */
  hard: boolean;
  weight?: number;
  /** One-line human explanation, shown on the Plan card. */
  why: string;
  /** false → planner couldn't find a reliable way to check it (raise in clarify). */
  feasible: boolean;
}

// Launch is locked to a single Apify actor — Google Maps. Gemini does all
// downstream research (website reading, analysis, list-building). The B2B
// people-finder actor is intentionally retired for first launch; re-add its key
// here when it returns.
export type ActorKey = "google_maps";
export type LeadType = "LOCAL" | "B2B";

export interface ResolvedPlan {
  actorKey: ActorKey;
  leadType: LeadType;
  /** Actor input params (search/location/roles/industries/maxResults …). */
  params: Record<string, unknown>;
  criteria: Predicate[];
  maxResults: number;
  estimatedResults: number;
  humanSummary: string;
  /** Add-on enrichments the run needs (drives both behavior and COGS estimate). */
  enrichments?: {
    companyContacts?: boolean;   // scrape email/phone
    emailVerification?: boolean;
    businessLeads?: boolean;     // decision-maker enrichment
    socialEnrichment?: boolean;
  };
}

export interface ClarifyQuestion {
  id: string;
  type: "text" | "single_select" | "multi_select" | "number";
  question: string;
  options?: string[];
  required: boolean;
  why: string;
}

export type PlannerDecision =
  | { status: "needs_clarification"; questions: ClarifyQuestion[] }
  | { status: "ready"; plan: ResolvedPlan };

/** Per-lead evaluation result stored on Lead.signals. */
export interface CriteriaMatch {
  passedHard: boolean;
  softScore: number;          // 0–100 contribution from soft predicates
  matched: Array<{ field: string; ok: boolean; detail?: string }>;
  /** Predicates deferred to the LLM judge (evaluated in qualification). */
  judgeFields: string[];
}
