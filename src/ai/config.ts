import type { ResolvedPlan } from "@/ai/criteria/types";

export type RunMode = "CENTRAL" | "BYOK";

/**
 * Returns agent parameters based on run mode.
 * CENTRAL: optimized (temperature=0, tight limits, char limit prompts)
 * BYOK: natural Claude (temperature=1, generous limits, no char limit injection)
 */
export function getRunConfig(mode: RunMode) {
  if (mode === "CENTRAL") {
    return {
      temperature: TEMPERATURE as number | undefined,
      maxTokens: AGENT_MAX_TOKENS,
      injectCharLimits: true,
    };
  }
  return {
    temperature: undefined as number | undefined, // use model default (1)
    maxTokens: {
      icpAnalyzer:      1024,
      companyAnalyzer:  1024,
      qualification:     512,
      personalization:  1536,
    },
    injectCharLimits: false,
  };
}

/**
 * Central configuration for all Claude API calls.
 *
 * WHY THIS EXISTS:
 * Token usage must be consistent across every user and every run so that:
 *  - Token budgets per plan tier are predictable
 *  - Costs per 100 leads stay within the $2.70 estimate
 *  - No single user can generate runaway AI spend
 *
 * RULES:
 *  - temperature: 0      → removes output randomness / length variance
 *  - max_tokens          → hard cap per agent, sized to exactly fit the output schema
 *  - Input limits (chars) → prevents large user inputs from bloating prompt tokens
 */

export const CLAUDE_MODELS = {
  /** Fast + cheap — used for classification/scoring tasks */
  fast:  "claude-haiku-4-5",
  /** Smart + capable — used for analysis + copy writing */
  smart: "claude-sonnet-4-5",
} as const;

/**
 * Centralized Gemini models (the platform default for all pipeline AI work).
 * Logical → concrete model id, overridable via env without a code change so we
 * can track Gemini model renames/deprecations.
 */
export const GEMINI_MODELS = {
  flash:     process.env.GEMINI_FLASH_MODEL ?? "gemini-2.5-flash",
  flashLite: process.env.GEMINI_FLASH_LITE_MODEL ?? "gemini-2.5-flash-lite",
} as const;

export type AgentTask =
  | "planner"
  | "icpAnalyzer"
  | "companyAnalyzer"
  | "research"
  | "qualification"
  | "personalization";

/** Per-task model map. Cheap tier for scoring/research, flash for routing + copy. */
export const TASK_MODELS: Record<AgentTask, string> = {
  planner:         GEMINI_MODELS.flash,       // routing + clarification
  icpAnalyzer:     GEMINI_MODELS.flash,
  companyAnalyzer: GEMINI_MODELS.flashLite,
  research:        GEMINI_MODELS.flashLite,
  qualification:   GEMINI_MODELS.flashLite,
  personalization: GEMINI_MODELS.flash,       // quality matters most
};

/**
 * Curated OpenRouter models offered in the BYOK provider picker.
 * All free, general-purpose instruct models that follow JSON instructions well
 * (verified live against https://openrouter.ai/api/v1/models). Users can also
 * paste any custom OpenRouter slug. One model is used for every agent role
 * (OpenRouter has no fast/smart split here).
 */
export const OPENROUTER_MODELS = [
  { slug: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B — free (recommended)" },
  { slug: "qwen/qwen3-next-80b-a3b-instruct:free",  label: "Qwen3 Next 80B — free" },
  { slug: "openai/gpt-oss-120b:free",               label: "GPT-OSS 120B — free" },
  { slug: "google/gemma-4-31b-it:free",             label: "Gemma 4 31B — free" },
  { slug: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Hermes 3 405B — free" },
] as const;

export const DEFAULT_OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

/**
 * Qualified-only delivery: not every discovered candidate qualifies, so to hit
 * the requested number of QUALIFIED leads we over-fetch this multiple of the
 * REMAINING gap to target each round, research + score them, keep the qualified,
 * and delete the rest. The top-up loop runs more rounds (scanning new search
 * pages) if a round falls short, so a modest 2× buffer is enough — a larger
 * multiplier just over-delivers far past what the user asked for (and silently
 * burns their Apollo credits + AI tokens). Capped by MAX_DISCOVERY_CANDIDATES.
 */
export const QUALIFIED_OVERFETCH_MULTIPLIER = 2;
export const MAX_DISCOVERY_CANDIDATES = 120;

/**
 * Top-up loop: if a discovery round ends with fewer QUALIFIED leads than the
 * user asked for, the pipeline runs another round (fetching progressively
 * more) until it hits the target, runs out of fresh candidates, or reaches
 * this many rounds — a hard ceiling to bound cost/time.
 */
export const MAX_DISCOVERY_ROUNDS = 5;

/**
 * How many raw candidates discovery should crawl to reliably deliver
 * plan.maxResults AFTER the hard-criteria filter.
 *
 * Selective conditions (e.g. "no website", a rating floor, "B2B not B2C")
 * reject most candidates, so crawling exactly maxResults returns almost nothing
 * — a search for "coffee shops without a website" found 5 cafes, all of which
 * had websites, and delivered 0. When the plan carries any hard filter we
 * over-fetch a large pool (capped at MAX_DISCOVERY_CANDIDATES) so matches in the
 * long tail surface; with no deterministic filter a small buffer is enough.
 */
export function discoveryCandidateTarget(plan: ResolvedPlan): number {
  const hardFilters = plan.criteria.filter(
    (c) => c.hard && c.evaluator !== "source"
  ).length;
  if (hardFilters === 0) {
    return Math.min(MAX_DISCOVERY_CANDIDATES, Math.max(plan.maxResults, Math.ceil(plan.maxResults * 1.5)));
  }
  return Math.min(MAX_DISCOVERY_CANDIDATES, Math.max(60, plan.maxResults * 10));
}

// Exact rating thresholds the Google Maps actor's placeMinimumStars filter supports.
const STAR_ENUM: Record<string, string> = {
  "2": "two", "2.5": "twoAndHalf", "3": "three", "3.5": "threeAndHalf", "4": "four", "4.5": "fourAndHalf",
};

/**
 * Map a plan's hard conditions onto the Google Maps actor's NATIVE filters so
 * they're applied at the source — far more accurate and cheaper than crawling a
 * big pool and filtering in memory:
 *   - hasWebsite false/true → website: withoutWebsite / withWebsite
 *   - rating >= {2,2.5,3,3.5,4,4.5} → placeMinimumStars
 * Returns the actor params to merge into buildInput, plus the set of criterion
 * fields FULLY handled at source (so discovery can skip over-fetching for them).
 * (categoryFilterWords is intentionally omitted — the actor's docs warn it drops
 * places that mis-categorize themselves, which would lose leads.)
 */
export function googleMapsNativeFilters(plan: ResolvedPlan): { params: Record<string, unknown>; covered: Set<string> } {
  const params: Record<string, unknown> = {};
  const covered = new Set<string>();
  for (const c of plan.criteria) {
    if (!c.hard) continue;
    if (c.field === "hasWebsite") {
      if ((c.op === "eq" && !c.value) || c.op === "not_exists") { params.website = "withoutWebsite"; covered.add("hasWebsite"); }
      else if ((c.op === "eq" && !!c.value) || c.op === "exists") { params.website = "withWebsite"; covered.add("hasWebsite"); }
    } else if (c.field === "rating" && c.op === "gte") {
      const key = STAR_ENUM[String(Number(c.value))];
      if (key) { params.placeMinimumStars = key; covered.add("rating"); }
    }
  }
  return { params, covered };
}

/**
 * The crawl discovery will ACTUALLY perform for a plan: how many candidates to
 * pull and whether to scrape each site for contacts. When the actor's native
 * filters already cover every hard condition, the returned places ARE the matches,
 * so a small buffer suffices. Otherwise some conditions are filtered in memory, so
 * we over-fetch (capped: 60 listing-only, 25 when scraping each site). Shared by
 * discovery AND the credit estimate so the reserved hold matches the real crawl.
 */
export function resolveCrawl(plan: ResolvedPlan): { candidateTarget: number; scrapeContacts: boolean } {
  const { params, covered } = googleMapsNativeFilters(plan);
  const noWebsite = params.website === "withoutWebsite";
  const scrapeContacts = !noWebsite && plan.enrichments?.companyContacts !== false;

  // Hard conditions still decided in memory (not covered by a native actor filter
  // and not a query-time source predicate) are what force the over-fetch.
  const remainingHard = plan.criteria.filter(
    (c) => c.hard && c.evaluator !== "source" && !covered.has(c.field)
  ).length;
  if (remainingHard === 0) {
    // Native filters return exact matches; a 3× buffer covers dedup + the few
    // results that turn out to have no usable contact (e.g. no-website AND no phone).
    const t = Math.min(MAX_DISCOVERY_CANDIDATES, Math.max(plan.maxResults, plan.maxResults * 3));
    return { candidateTarget: t, scrapeContacts };
  }
  const pool = discoveryCandidateTarget(plan);
  return { candidateTarget: scrapeContacts ? Math.min(pool, 25) : Math.min(pool, 60), scrapeContacts };
}

/**
 * Hard output ceiling per agent (in tokens).
 * Each value is sized to the MAXIMUM plausible JSON output for that schema,
 * not a generous round number. Shrinking this is the primary lever for
 * reducing per-run token spend.
 *
 * Sizing rationale:
 *  icpAnalyzer:    ~600 chars of JSON ≈ 180 tokens. 500 gives comfortable headroom.
 *  companyAnalyzer:~700 chars of JSON ≈ 200 tokens. 512 gives headroom.
 *  qualification:  ~350 chars of JSON ≈ 100 tokens. 256 gives headroom.
 *  personalization:~920 chars of emails (incl. followUp3) ≈ 230 tokens. 900 gives headroom.
 */
export const AGENT_MAX_TOKENS = {
  icpAnalyzer:      750,  // bumped from 500 — now emits a broader title/industry net
  companyAnalyzer:  512,
  qualification:    400,  // bumped from 256 — now generates serviceGaps array
  personalization:  900,  // bumped from 700 — now generates followUp3 as well
} as const;

/**
 * Temperature = 0 for ALL agents.
 * This makes Claude choose the most probable token at every step,
 * which produces consistent output lengths and eliminates run-to-run variance.
 */
export const TEMPERATURE = 0;

/**
 * Input truncation limits (characters, applied before building the prompt).
 * These prevent unusually large user inputs from blowing up the input token count.
 *
 * 1 token ≈ 4 chars in English. Limits below are conservative.
 */
export const INPUT_LIMITS = {
  /** Apify-scraped website content fed to Company Analyzer */
  websiteContent:        2000,  // ~500 input tokens
  /** ICP summary string carried into Company Analyzer + Qualification */
  icpSummary:             400,  // ~100 input tokens
  /** Qualification criteria paragraph from ICP Analyzer */
  qualificationCriteria:  300,  // ~75 input tokens
  /** Serialized company analysis JSON fed to Qualification Agent */
  companyAnalysisJson:    600,  // ~150 input tokens
  /** Service offered description from BusinessProfile */
  serviceOffered:         200,  // ~50 input tokens
  /** Pain points solved description from BusinessProfile */
  painPointsSolved:       300,  // ~75 input tokens
} as const;

/**
 * Per-field character limits enforced inside prompts.
 * These are injected into the prompt instructions so Claude knows
 * exactly how long each field can be.
 */
export const FIELD_CHAR_LIMITS = {
  // ICP Analyzer
  buyerPersona:            40,   // "VP of Sales at a SaaS company"
  qualifyingSignal:        60,   // "Company recently posted 3+ SDR job openings"
  disqualifyingSignal:     50,
  apolloJobTitle:          35,
  apolloIndustry:          30,
  outreachAngle:           80,   // "Lead with the manual prospecting pain point"
  qualificationCriteria:  200,  // paragraph

  // Company Analyzer
  acquisitionGap:          80,
  growthBottleneck:        70,
  techStackItem:           30,
  recentSignal:            80,
  fitAssessment:          150,  // 1-2 sentences
  bestOutreachAngle:       80,

  // Qualification
  primaryReason:           90,
  bestAngle:               80,
  painPointMatch:          60,
  personalizationHook:     70,
  serviceGap:             100,  // specific gap this lead has that our service solves

  // Personalization (full emails: greeting + short paras + CTA + sign-off)
  subjectLine:             55,   // ~7 words
  emailBody:              700,  // greeting + 3 short paras + sign-off
  followUp1:              340,  // greeting + 2-3 sentences + sign-off
  followUp2:              260,  // greeting + 1-2 sentences + sign-off
  followUp3:              240,  // greeting + graceful close + sign-off
} as const;
