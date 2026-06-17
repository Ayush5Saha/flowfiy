# NL Lead Pipeline — Implementation Plan (Master)

> Status: **Implemented & shipped** — the credits / NL-pipeline cutover is live
> (phases 1–8 landed; see git history). Retained as the design of record.
> Companion to [`nl-lead-pipeline.md`](./nl-lead-pipeline.md) (the spec).
> Last updated: 2026-06-17

This document is the single source of truth for *how* we built the spec. It is
grounded in the current code.

**Post-cutover addition — no-subscription trial:** a new org can generate up to
**100 leads on credits alone** (minimum deposit **75 credits** = 100 leads at
~2/credit plus a 50% buffer for high-condition leads); lead 101 requires an
active subscription. Tracked via `Organization.trialLeadsUsed`, enforced at
confirm and tallied at run reconcile.

## Locked decisions (from review)

1. **Centralization:** the NL pipeline uses Flowfiy-owned env keys for **Gemini,
   Apify, and Prospeo**. BYOK (per-org Apollo/Apify/Claude/OpenRouter) is retired
   from the runtime path. Credits are the only meter.
2. **Cutover:** the NL composer **replaces** the existing "Generate Leads" entry
   point in one coordinated release (no long coexistence window). CSV import stays.
3. **Economics defaults:** **60% = NET profit** (after payment fees + empty-run/refund
   buffer); charging is **cost-plus, reconciled per run** on a per-qualified-lead basis
   (see §J) — `REVENUE_MULTIPLIER ≈ 3.2×`; plan credits **roll over once / expire after
   60 days**; the **planner LLM call is free** (absorbed); **top-up min 50 / max 5,000
   credits**. The "local 3 / B2B 1.5 leads per credit" tiers are kept only as the
   *estimate* heuristic, not the charged amount (which is actual COGS × markup).
4. **Condition-based targeting is a first-class, general capability** (see §B).

---

## A. Architecture — reuse vs. build

| Layer | Reuse as-is | Build new |
|---|---|---|
| Worker pipeline | 4 BullMQ queues + processors (`src/workers`), `finalizeOrTopUp` (`src/lib/pipeline-finalization.ts`) | `LeadRequest` parent row owns a run; discovery driven by a chosen actor |
| LLM | `LLMClient` interface + agent pattern (`src/ai/llm.ts`, `src/ai/agents/*`) | `GeminiLLMClient`; per-task model map; central resolver; Anthropic fallback seam |
| Discovery | Actor implementations in `src/integrations/apify.ts` (Maps, leads-finder, peakydev) | Actor **registry** + **criteria engine** + Planner that selects/parameterizes them |
| Data | `Lead`, `LeadList`, `LeadResearch`, `OutreachCopy`, `Campaign`, `email-send`, Gmail send | `LeadRequest`, `CreditWallet`, `CreditLedger` + enums; optional `Lead.signals` |
| Billing | Razorpay/Stripe checkout + webhooks | $50 plan → 400-credit grant; subscription-gated custom top-up |
| Gating | — | `creditService` (estimate/reserve/consume/release) replaces `reserveGenerationQuota` + `checkTokenBudget` |
| UI | `LiveLogsPanel`, lead detail/table, sidebar shell, currency lib | Composer, Clarify panel, Plan card, Review table, Credit pill, Buy-credits panel |

**Discovery reframe:** today = "Apollo first, Apify fallback" (`handleSearchLeads`).
New = Planner picks `actorKey` (`google_maps` | `leads_finder`) + params + criteria;
the discovery stage calls that actor via the **platform** Apify token. Existing actor
code becomes the implementation behind registry entries (re-wire inputs, minimal rewrite).

---

## B. Condition-based ("qualitative") lead finding — the general criteria engine

Users give arbitrary qualitative conditions. We cannot hardcode them, so we
**decompose → route to the cheapest evaluator → evaluate funnel-style → score/filter**,
with an LLM-judge fallback that guarantees coverage of *any* phrasing.

### B.1 Criteria IR (intermediate representation)
The Planner outputs, alongside the actor + base params, a list of predicates:
```
{ field, op, value,
  evaluator: "source" | "attribute" | "signal:<id>" | "judge",
  hard: boolean,      // hard → filter (must match); soft → ranking boost
  weight?: number,    // for soft predicates
  why: string,        // human explanation (shown on the Plan card)
  feasible: boolean }  // false → planner raises it in clarification, never silently drops
```

### B.2 Four evaluator tiers (cheapest first)
1. **source** — pushed into the actor query (free, filters at the API). Reuses the
   ICP mappings in `src/lib/icp.ts` (titles/size/country/industry/revenue/funding).
2. **attribute** — computed in memory from actor output (free): rating, review
   count, size, has-email/phone, founded year, hours, etc.
3. **signal:`<id>`** — an active probe run only on survivors, only for referenced
   providers (metered). Provider interface frozen now; providers added over time:
   `website-audit`, `tech-detect`, `ads-probe`, `jobs-probe`, `reviews`, `funding-news`.
4. **judge** — LLM evaluation over the company research we already gather
   (piggybacks the existing Gemini analyze/qualify calls → near-zero extra cost).
   Handles fuzzy/novel conditions ("looks premium", "B2B not B2C").

Funnel order narrows the candidate set so expensive tiers touch fewer leads:
`source push-down → attribute filter → signal enrichment → judge → score & filter`.
Hard predicates exclude; soft predicates feed the 0–100 score. Each lead carries
**matched-signal chips** for the review UI and outreach.

### B.3 "Handle everything" guarantee
- Canonical-field **registry** (`src/ai/criteria/registry.ts`) maps synonyms →
  field → evaluator + (if source) actor param. Adding a computable condition = one
  registry entry (+ one provider if it needs a probe).
- Anything **not in the registry routes to `judge`** automatically → unseen
  conditions still get evaluated.
- The Planner must: explain *how* each condition is checked + hard/soft on the
  Plan card; mark un-evaluable conditions `feasible:false` and ask in clarification;
  fold any probe/audit cost into the credit estimate **before Run**.

### B.4 Worked examples
| User says | Predicates → evaluator · hard/soft |
|---|---|
| small businesses with no website | category/loc → source·hard; size=small → attribute·soft; websiteStatus=none → signal:website-audit·hard |
| shops with a slow/buggy website | websiteStatus∈{slow,broken} → signal:website-audit·hard |
| dentists in Texas with bad reviews | category+loc → source·hard; rating<4.0 → attribute·hard; reviews≥10 → attribute·soft |
| ecommerce running FB ads + weak website | runningAds=true → signal:ads-probe·hard; websiteStatus=outdated → signal:website-audit·hard |
| gyms with no online booking | category=gym → source; tech.booking=absent → signal:tech-detect·hard |
| restaurants that look high-end | vibe=premium → judge·hard |
| B2B agencies, not B2C, <20 staff, US | industry/country/size → source·hard; audience=B2B → judge·hard |
| SaaS that recently raised funding | industry=software → source; funding.recent=true → source or signal:funding-news·hard |

### B.5 Website-audit provider (first signal, from the "bad website" ask)
`src/ai/criteria/providers/website-audit.ts` (extends fetch logic in
`src/lib/website-scraper.ts`) grades each site:
`none` (no website) · `broken` (DNS/refused/5xx/TLS) · `slow` (TTFB/load over
threshold) · `outdated` (no `<meta viewport>`, no HTTPS, missing title/desc, stale
copyright, tiny page). Stores `{status, score, reasons[]}` on the lead.

**Discovery must become criteria-aware:** the current Maps path keeps only places
with BOTH website AND email (`apify.ts:_searchWithGoogleMaps`) and the contact-quality
gate requires a working website (`handlers.ts:filterByContactQuality`) — that discards
exactly the no/broken-website leads we want. The gate becomes criteria-driven: for
website-less targets, phone/Maps-listing is a valid contact path; email not required.

**Open product point:** no-website locals often have no email; v1 is email-only
(Gmail). Recommendation: use Maps-scraped email/phone where present; mark phone-only
leads as exportable (not auto-emailable) rather than dropping them. Confirm at implement.

---

## C. Build phases

### Phase 1 — Credits foundation
- Schema: `CreditWallet`, `CreditLedger`, `CreditEntryType` (spec §8.2).
- `src/lib/credits/rates.ts` (spec §9.2 constants).
- `src/lib/credits/service.ts` — only code that mutates wallets; all via
  `prisma.$transaction` + row locks. `getWallet / estimate / reserve(HOLD) /
  consume(CONSUME w/ true COGS) / release(RELEASE) / grant / purchase / refund / adjust`.
  Charging uses the cost-plus reconciliation model in §J.
- COGS: `landedCostUsd()` = actor (incl. rejected candidates) + signal probes (incl.
  rejects) + Prospeo? + Gemini tokens (research/qualify/personalize, incl. disqualified
  leads) × rate; agents return real token usage so reconciliation is accurate.
- Validate on staging in **observe-only** mode (record COGS, don't charge) to confirm
  LOCAL≈1 / B2B≈2–3 credit tiers and ≥60% margin before cutover.

### Phase 2 — Gemini centralization
- `GeminiLLMClient` in `src/ai/llm.ts` (implements `LLMClient`; function-calling map).
- `TASK_MODELS` + `GEMINI_MODELS` in `src/ai/config.ts`.
- `getCentralLLMClient(task)` in `src/ai/client.ts`; Anthropic fallback seam (config),
  launch Gemini-only.
- Swap `getClaudeClientForOrg` → `getCentralLLMClient` in the 4 processors; remove
  hardcoded `claude-sonnet-4-5` in `orchestrator.ts`. BYOK columns kept but unused.

### Phase 3 — Actor registry + criteria engine
- `src/ai/actors/registry.ts` — `{ google_maps, leads_finder }` with
  `{key, apifyActorId, leadType, description, paramsSchema, normalize}`.
- `getPlatformApifyClient()` (`APIFY_PLATFORM_TOKEN`); `ApifyClient.runActor()` primitive.
- `src/integrations/prospeo.ts` (`PROSPEO_API_KEY`) — B2B email resolution when missing.
- `src/ai/criteria/{types,registry,engine}.ts` + `providers/website-audit.ts`.
- Generalize `lead-discovery.processor.ts`: read `LeadRequest.plan` → actor + criteria
  → run → normalize → criteria funnel (source/attribute/signal) → dedupe → quality gate
  (criteria-aware) → save leads → fan out research.

### Phase 4 — Planner + clarification
- `src/ai/agents/planner.ts` + prompt: input = raw query + BusinessProfile + actor
  registry + criteria registry + "specific enough" rules. Output = `{status,
  questions[] | plan}` with the Criteria IR (hard/soft, why, feasible) via Gemini
  function-calling. Rules: ≤3 questions/round, ≤2 rounds, prefer selects, every Q has `why`.
- `judge` predicates added as scoring dimensions in the qualification agent.

### Phase 5 — Confirm + run + review
- `LeadRequest` state machine: `DRAFTING → CLARIFYING ⇄ PLANNED → CONFIRMED →
  RUNNING → READY_FOR_REVIEW → SENDING → DONE` (+ FAILED/CANCELLED).
- Confirm: `reserve(estimate)` atomically → create `LeadList` → enqueue discovery.
  **No paid call before Run.**
- Run: per-lead `consume()` with true COGS; `finalizeOrTopUp` extended to `release()`
  unused hold + flip to `READY_FOR_REVIEW`. Mid-run exhaustion → pause + top-up prompt.
- Review→send: reuse approve/send → `Campaign` → `email-send` → Gmail.

### Phase 6 — Buy credits
- $50 plan grants 400 credits/cycle: extend Razorpay/Stripe webhooks → `PURCHASE`
  ledger + `balance += 400`, idempotent on gateway payment id.
- `/api/credits/topup` (subscription-gated, **403** otherwise; UI hides panel).
  Credits added only on verified webhook, idempotent. Live cost via `quote` + currency lib.
- Provider float: auto-recharge + admin spend-spike alerts.

### Phase 7 — Polish
- More signal providers (`tech-detect`, `ads-probe`, `jobs-probe`, `funding-news`).
- Admin margin/COGS dashboard (extend `admin/ai-usage`). Credit expiry job
  (rollover-once / 60-day). Optional auto-send toggle (default off).

### Phase 8 — Marketing, content & compliance sweep (lands with cutover)
The whole public surface currently sells the old model (5 INR tiers, "generations",
5 Claude agents, BYOK, Apollo as source). Rewrite:
- Pricing: `src/app/(marketing)/pricing/page.tsx`, `src/components/landing/v2/PricingV2.tsx`
  → single $50/400-credit plan + top-ups; rewrite metadata, plans, FAQ, JSON-LD.
- Landing copy: `Hero.tsx`, `LandingPage.tsx`, `FinalCTAV2.tsx`, `ProofStrip.tsx`,
  `StoryScroll.tsx`, `FeatureRail.tsx`, `TestimonialsV2.tsx` → "Describe the leads you
  want"; drop 5-agents/BYOK/generations; add credits + condition-based targeting.
- Answer-engine brief: `src/app/llms.txt/route.ts` → managed AI (no keys), credits,
  Maps+B2B source (not Apollo).
- Comparisons: `vs/apollo`, `vs/clay`, `vs/[slug]`, `src/lib/seo/competitors.ts`.
- Use-cases: `ai-lead-generation`, `cold-email-automation`, `use-cases/page.tsx`
  + new "find businesses that need a website".
- Blog: rewrite `byok-ai-pricing-explained` → "no API keys, simple credits" + **301 old
  slug**; update `how-to-set-up-flowfiy`, `how-ai-agents-replace-sdrs`,
  `cold-email-personalization-2026`; add a condition-based-targeting post; review DB
  `BlogPost` rows via admin editor.
- Glossary: `src/lib/seo/glossary.ts` → drop BYOK/generations; add credits/criteria/audit.
- **Legal (compliance):** `terms`, `privacy`, `refund` → credits = deferred revenue,
  GST, expiry/refund policy, and updated sub-processor list (Gemini/Apify/Prospeo now
  Flowfiy-owned, not the user's keys).
- Onboarding: `OnboardingWizard.tsx` → remove API-key step; end on first NL request.
- Root metadata: `src/app/layout.tsx`.

---

## D. Data model & migration (non-destructive)
- Additive only: new tables `LeadRequest`, `CreditWallet`, `CreditLedger` + enums;
  optional relations on `Organization`/`LeadList`; optional `Lead.signals Json?`.
- Deprecated fields (`generationCount/Limit`, `apiMode`, `llmProvider`,
  `openRouterModel`, `monthlyTokensUsed`) left in place, unused; remove in a later cleanup.
- Backfill: create a `CreditWallet` (0) per org; grant active subscribers their cycle's
  400 credits at cutover so they aren't locked out.
- Order: `prisma migrate` → `prisma generate` → deploy workers + web together.

## E. API surface (new)
`/api/lead-requests` POST (create→plan) · `/[id]/clarify` POST · `/[id]/confirm` POST
(reserve+enqueue) · `/[id]` GET (poll) · `/[id]/cancel` POST (release) · `/[id]/review`
GET · `/[id]/send` POST · `/api/credits` GET · `/api/credits/quote` GET ·
`/api/credits/topup` POST (403 if no active sub). All mutations idempotent.

## F. UI components (new, in `src/components/leads/` unless noted)
`LeadRequestComposer` (NL box, replaces GenerateLeadsButton) · `ClarificationPanel`
(chips/radio/text/stepper, ≤2 rounds) · `PlanConfirmCard` (summary + editable params +
criteria w/ how-checked icons + credit estimate + balance-after + Run/Edit/Cancel) ·
`RunProgress` (reuse LiveLogsPanel + stage stepper) · `LeadReviewTable` (extend
LeadDataTable: select + inline edit + score pill + matched-signal chips + Approve&send) ·
`CreditBalancePill` (Sidebar, replaces generations bar) · `BuyCreditsPanel` (number +
live local cost + Pay; gated behind active subscription). Every component specced for
loading / empty / error / insufficient-balance / mid-run-paused / zero-results states.

## G. Guardrails & verification
Guardrails (spec §14): no paid call before Run; hard maxResults ceiling; insufficient
balance blocks confirm; top-up needs active sub (API+UI); mid-run exhaustion finishes
paid leads + pauses rest; actor failure/empty → release + no charge; dedup by
email/domain/place-id; clarification ≤2 rounds; confirm/send idempotent.
Verification: unit (creditService math + idempotency); integration (full staging run,
ledger nets to purchased−consumed, held→0); economics (observe-only confirms tiers +
≥60% margin on B2B-heavy mix); webhook replay (no double-credit); preview-tool walkthrough.

## H. New env / config
`GEMINI_API_KEY`, `APIFY_PLATFORM_TOKEN`, `PROSPEO_API_KEY`, the two actor IDs,
Razorpay/Stripe credit-pack ids, provider auto-recharge thresholds.

## I. Open items to confirm at implement time
- No-website leads with no email → keep as phone-only exportable vs. require email.
- Exact `slow`/`outdated` thresholds for the website-audit provider.
- Whether deeper PageSpeed/Lighthouse audit is a metered add-on (v2).
- Final `GATEWAY_FEE_RATE` / `BUFFER_RATE` values once live gateway + refund data exist.

## J. Credit charging model — cost-plus, reconciled per run

Charge from **actual COGS**, spread over **qualified leads delivered**, marked up to hold
**60% net** profit. Extends the estimate→reserve→consume→release flow:

1. **Estimate** at plan time from a rate card (lead-type × criteria-tier × expected match
   rate) → credit ceiling shown on the Plan card.
2. **Reserve (HOLD)** the estimate at confirm. The estimate is a **ceiling** — the user is
   never charged above what they approved.
3. **Accrue COGS** for everything examined during the run (actor incl. rejects, signal
   probes incl. rejects, Prospeo, all Gemini tokens incl. disqualified leads). Planner +
   Gmail send are free.
4. **Reconcile at run end (compute at run level, not per-lead, to avoid rounding inflation):**
   ```
   run_credits = ceil( total_run_COGS_usd × REVENUE_MULTIPLIER × FX_INR_PER_USD / CREDIT_VALUE_INR )
   ```
   clamped to ≤ the reserved hold. `CONSUME` that; `RELEASE` the remainder.
5. **Empty / failed run (0 qualified):** charge nothing, release the full hold — the COGS
   loss is covered by the buffer baked into the multiplier.

**Multiplier (self-documenting, in `src/lib/credits/rates.ts`):**
```
REVENUE_MULTIPLIER = 1 / (1 - TARGET_NET_MARGIN - GATEWAY_FEE_RATE - BUFFER_RATE)
                   = 1 / (1 - 0.60 - 0.035 - 0.05) = 1 / 0.315 ≈ 3.17×
```
GST is charged on top (passthrough) → excluded from the margin math.

**Consequence:** leads-per-credit **varies per search** (strict/audit-heavy searches cost
more per lead). Marketing copy (Phase 8) says "~2 leads/credit, varies by search," not a
fixed promise.

**Worked check:** "no-website cafés," ~200 candidates → 50 qualified, run COGS ≈ $1.15 →
`ceil(1.15 × 3.17 × 84 / 10)` = **31 credits for 50 leads ≈ 1.6 leads/credit**.
