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
 * the requested number of QUALIFIED leads we over-fetch this multiple of
 * candidates, research + score them all, keep the qualified, and delete the
 * rest. Capped by MAX_DISCOVERY_CANDIDATES to bound Apify/AI spend per run.
 */
export const QUALIFIED_OVERFETCH_MULTIPLIER = 6;
export const MAX_DISCOVERY_CANDIDATES = 120;

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
  icpAnalyzer:      500,
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
