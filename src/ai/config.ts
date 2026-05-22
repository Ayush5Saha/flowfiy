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
  qualification:    256,
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

  // Personalization
  subjectLine:             55,   // ~7 words
  emailBody:              400,  // 4-5 sentences
  followUp1:              200,  // 3 sentences
  followUp2:              130,  // 2 sentences
  followUp3:              120,  // 2 sentences — final "closing the loop" touch
} as const;
