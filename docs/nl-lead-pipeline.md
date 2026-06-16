# Natural-Language Lead Pipeline — Implementation Spec

> Status: **Proposal for review** (not yet implemented)
> Owner: Flowfiy
> Last updated: 2026-06-16

A single natural-language input where a user describes the leads they want. A
centralized platform LLM (Gemini) interprets the request, asks **clarifying
questions when the request is too vague**, proposes a **plan the user confirms
before running**, drives the right **Apify actor** to fetch leads, enriches +
qualifies them, writes **personalized outreach** from the user's business
profile, and sends via **Gmail after the user reviews**. All paid steps are
**metered against a prepaid credits balance**.

---

## 1. Goals & non-goals

**Goals**
- One NL input box → end-to-end lead generation + outreach.
- **No BYOK.** A single centralized LLM (Gemini) for all users, billed via credits.
- LLM-driven **actor routing**: the model picks the right Apify actor + parameters.
- **Intelligent clarification**: when a request is too broad/ambiguous, ask precise
  follow-ups via a popup input or an MCQ panel (Claude-style), then proceed.
- **Confirm-before-run** (with a credit estimate) and **review-before-send**.
- Prepaid **credits** metering with a protected margin.

**Non-goals (this phase)**
- Multi-channel (WhatsApp/LinkedIn DMs) — email only for v1.
- Auto-send without review (opt-in, later phase).
- Self-hosting models. Centralized Gemini via API only.

---

## 2. What already exists (reused, not rebuilt)

| Capability | Where | Reuse |
|---|---|---|
| Agentic tool-calling orchestrator | `src/ai/orchestrator.ts` | Pattern reused; generalize tools + model |
| Tool definitions / handlers | `src/ai/tools/definitions.ts`, `handlers.ts` | Add Apify-actor tools + planner |
| LLM client abstraction | `src/ai/llm.ts`, `src/ai/client.ts`, `src/ai/config.ts` | Add Gemini provider; per-task model map |
| 4-stage pipeline + email queue | `src/workers/queues.ts`, `src/workers/processors/*` | Add discovery-by-actor + planning |
| Business profile / ICP | `BusinessProfile` model, settings/onboarding | Feeds personalization + planner |
| Gmail OAuth send | `email-send` queue + Gmail integration | Reused as-is for review→send |
| Lead data model | `LeadList`, `Lead`, `LeadResearch`, `OutreachCopy` | Reused; `LeadList` gets a parent request |
| Usage logging | `UsageEvent`, `Organization.generationCount` | Superseded by credits ledger |

**Key change to internalize:** the current orchestrator hardcodes
`model: "claude-sonnet-4-5"` and the `search_leads` tool is Apollo-only. We
generalize both: model becomes config-driven (Gemini, per-task tier), and
discovery becomes a **registry of Apify actors** the LLM selects from.

---

## 3. End-to-end UX flow

```
[1] User types request  ──►  [2] Planner LLM
                                   │
                   ┌───────────────┴───────────────┐
                   ▼                                ▼
         needs_clarification                     ready
                   │                                │
        [3] Clarify panel (MCQ / text)             │
                   │  (answers fed back, loop)      │
                   └───────────────►────────────────┘
                                   ▼
                    [4] Plan + credit estimate  ──►  user CONFIRMS
                                   ▼
                    [5] Run (background): actor → normalize → enrich → qualify → write
                                   ▼
                    [6] Review drafts  ──►  user APPROVES  ──►  send via Gmail
                                   ▼
                          Credits reconciled
```

State machine for a request (`LeadRequest.status`):
`DRAFTING → CLARIFYING ⇄ PLANNED → CONFIRMED → RUNNING → READY_FOR_REVIEW → SENDING → DONE`
(+ `FAILED`, `CANCELLED`).

---

## 4. The intelligent clarification system

This is the main new "intelligence." It mirrors how Claude asks follow-ups.

### 4.1 How it decides
The **Planner agent** receives:
- the raw NL request,
- the user's `BusinessProfile` (so it doesn't re-ask what it already knows),
- the **actor registry** (what's possible to search), and
- a system prompt defining "specific enough to run."

It returns a **structured decision** (via Gemini function-calling / JSON schema):

```jsonc
{
  "status": "needs_clarification" | "ready",

  // when needs_clarification:
  "questions": [
    {
      "id": "location",
      "type": "text" | "single_select" | "multi_select" | "number",
      "question": "Which city or area should I search?",
      "options": ["Mumbai", "Delhi", "Bengaluru", "Pune"],   // for *_select
      "required": true,
      "why": "Google Maps needs a location to search."
    }
  ],

  // when ready:
  "plan": {
    "actorKey": "google_maps",
    "params": { "search": "coffee shops", "location": "Mumbai", "maxResults": 200 },
    "leadType": "LOCAL" | "B2B",
    "estimatedResults": 200,
    "humanSummary": "Search Google Maps for coffee shops in Mumbai, up to 200 results."
  }
}
```

### 4.2 When to ask (rules in the planner system prompt)
Ask **only high-value** questions; never interrogate. Trigger clarification when:
- **Unbounded scope** — no location for a local search, or no result cap on a huge category ("all dentists in India").
- **Missing a required actor param** that the profile/ICP doesn't supply.
- **Ambiguous category/intent** — "agencies" (marketing? travel? staffing?).
- **Source ambiguity** — request could be local (Maps) or B2B-by-title (LinkedIn) and the choice changes cost a lot.

Rules: **max 3 questions per round**, **max 2 rounds** (then proceed with best-guess defaults and surface them in the plan for the user to edit). Prefer
`single_select`/`multi_select` with concrete options over free text whenever the
option set is enumerable. Every question carries a one-line `why`.

### 4.3 UI
- Render `questions[]` in a **modal/panel** beneath the input box.
  - `single_select` → radio chips; `multi_select` → checkable chips; `text` → input; `number` → stepper.
- On submit, append answers to the request and **re-call the planner**.
- Loop until `status: "ready"` (or round cap) → render the **plan card** (§5).

---

## 5. Confirm-before-run

When the planner returns `ready`, show a **plan card**:
- Human summary ("Search Google Maps for coffee shops in Mumbai, up to 200 results").
- Editable params (location, category, max results, lead type).
- **Credit estimate** (see §9): `est. credits = estimatedResults × per-lead credit cost(leadType)`.
- Current balance + "after this run" balance. Block + prompt top-up if insufficient.
- Buttons: **Run** (→ `CONFIRMED`) / **Edit** (re-plan) / **Cancel**.

Hard guardrail: nothing hits a paid API before the user clicks **Run**.

---

## 6. Run pipeline (background)

On `CONFIRMED`, enqueue the discovery job. Stages (extend `src/workers`):

1. **Discovery (by actor)** — new `lead-discovery` behavior: call the chosen Apify
   actor with the planned params. Stream/collect results.
2. **Normalize** — map the actor's output to the common `Lead` shape (§8.3).
   Dedupe (by email/domain/place-id), drop junk.
3. **Enrich** (conditional) — if emails are missing and `leadType` needs named
   contacts, call Prospeo to resolve verified emails.
4. **Research** — scrape company website (Apify) → Gemini summarizes (cheap tier).
5. **Qualify** — Gemini scores 0–100 vs the business profile/ICP (cheap tier).
6. **Personalize** — Gemini writes subject + body + follow-ups using
   `BusinessProfile.businessDetails` + research (mid tier).

Reuse the existing per-stage queues (`lead-research`, `lead-qualification`,
`lead-personalization`) and `OutreachCopy`/`LeadResearch` models. The result is a
populated `LeadList` in `READY_FOR_REVIEW`.

> Credits are **reserved** at confirm (estimate) and **reconciled** after each
> paid step with actual cost (§9). Mid-run exhaustion pauses the run.

---

## 7. Review-before-send

- A review screen lists generated leads with their drafted email + follow-ups.
- User can edit copy, deselect leads, then **Approve & send**.
- Approved leads flow into a `Campaign` → existing `email-send` queue → Gmail OAuth.
- Follow-ups scheduled via the existing `enqueueEmailJob` delay mechanism.
- Auto-send remains an explicit opt-in toggle (default off) for a later phase.

---

## 8. Data model changes (Prisma)

### 8.1 New: `LeadRequest` (the NL request + its lifecycle)
```prisma
model LeadRequest {
  id              String   @id @default(uuid())
  organizationId  String   @map("organization_id")
  rawQuery        String   @map("raw_query")          // the user's sentence
  status          LeadRequestStatus @default(DRAFTING)
  clarifications  Json?                                // [{id, question, answer}]
  plan            Json?                                // resolved actor + params
  leadType        String?  @map("lead_type")          // LOCAL | B2B
  estimatedCredits Int?    @map("estimated_credits")
  actualCredits   Int?     @map("actual_credits")
  leadListId      String?  @unique @map("lead_list_id")
  error           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  leadList     LeadList?    @relation(fields: [leadListId], references: [id])

  @@map("lead_requests")
}

enum LeadRequestStatus {
  DRAFTING
  CLARIFYING
  PLANNED
  CONFIRMED
  RUNNING
  READY_FOR_REVIEW
  SENDING
  DONE
  FAILED
  CANCELLED
}
```

### 8.2 New: credits (`CreditWallet` + `CreditLedger`)
```prisma
model CreditWallet {
  id             String   @id @default(uuid())
  organizationId String   @unique @map("organization_id")
  balance        Int      @default(0)   // credits, integer micro-units (see §9)
  held           Int      @default(0)   // reserved by in-flight runs
  updatedAt      DateTime @updatedAt @map("updated_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@map("credit_wallets")
}

model CreditLedger {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  type           CreditEntryType
  amount         Int                          // signed: +purchase/grant, -consume
  balanceAfter   Int      @map("balance_after")
  costUsd        Decimal? @map("cost_usd") @db.Decimal(12, 6)  // true COGS snapshot
  refType        String?  @map("ref_type")    // "lead_request" | "lead" | "payment"
  refId          String?  @map("ref_id")
  metadata       Json?
  createdAt      DateTime @default(now()) @map("created_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@index([organizationId, createdAt])
  @@map("credit_ledger")
}

enum CreditEntryType {
  PURCHASE   // user bought credits
  GRANT      // free signup / promo credits
  HOLD       // reserved at confirm
  RELEASE    // unused reservation returned
  CONSUME    // actual spend
  REFUND
  ADJUST     // admin correction
}
```

### 8.3 Common normalized lead shape
Actor outputs differ; normalize into the existing `Lead` fields:
`firstName, lastName, email, title, companyName, companyWebsite, companySize,
industry, city, linkedinUrl, source, rawData`. Keep the original actor payload in
`Lead.rawData` for traceability.

### 8.4 Org cleanup
Once credits are live, deprecate `Organization.generationCount/generationLimit`
and the `ApiMode`/`LlmProvider`/`openRouterModel` BYOK fields (LLM is always
centralized Gemini). Keep `CALENDLY`/`GMAIL`/`APIFY` integration types; the
`CLAUDE`/`OPENROUTER` integration types become unused.

---

## 9. Credits & metering

### 9.1 Definitions & plan (LOCKED)
- **1 credit = ₹10.**
- **One paid plan: $50/month, includes 400 credits.**
- **Spend rate: 1 credit = 2 leads** → 400 credits = **~800 leads/month**.
  - Tier by lead type to guarantee margin: **local = 3 leads/credit, B2B = 1.5 leads/credit**
    (B2B costs ~2× local; flat 2/credit dips below 60% on all-B2B usage).
- **No free grant** — new signups have 0 credits and must buy the plan.
- **Top-ups**: additional credits sold at ₹10 each (same 2 leads/credit), ~65% margin.
- Margin target: **60% net contribution** (after COGS + payment fees + GST-as-passthrough
  + overhead/refund buffer). Corporate income tax is a separate downstream layer.

**Plan P&L (target):**
| Line | Amount | % |
|---|---|---|
| Revenue | $50.00 | 100% |
| Lead COGS (~800 × $0.012) | −$9.60 | 19% |
| Payment gateway (~3.5%) | −$1.75 | 3.5% |
| Tax + overhead + failed/refund buffer | −$7.50 | 15% |
| **Net contribution** | **~$31** | **~62%** |

Sized at ~62% to hold ≥60% under FX moves, retries, and B2B-heavy mixes.

### 9.2 Rate config (code constants first, admin-editable later)
```ts
// src/lib/credits/rates.ts (proposed)
export const FX_INR_PER_USD = 84;          // refresh periodically
export const CREDIT_VALUE_INR = 10;        // 1 credit = ₹10
export const LEADS_PER_CREDIT = { LOCAL: 3, B2B: 1.5 }; // margin-protecting tiers
export const MODEL_RATES = {               // USD per 1M tokens
  "gemini-flash-lite": { in: 0.10, out: 0.40 },
  "gemini-flash":      { in: 0.30, out: 2.50 },
};
export const ACTOR_RATES = {               // USD per result
  google_maps:   0.002,
  leads_finder:  0.00067,                   // $1 per 1,500 leads
};
export const ENRICH_RATES = { prospeo: 0.01 }; // USD per verified email (B2B, if actor lacks email)
```

### 9.3 Per-lead cost (computed, not guessed)
`landed_usd(lead) = actor_cost + enrich_cost? + Σ(model tokens × model rate)`
→ `credits = ceil(landed_usd × FX × MARGIN_MULTIPLIER)`.
Two visible tiers emerge (from the unit-economics doc): **LOCAL ≈ 1 credit/lead**,
**B2B ≈ 2–3 credits/lead**. Surface to users in business units, not tokens.

### 9.4 estimate → reserve → reconcile
1. **Estimate** at plan time: `estimatedResults × per-lead credit(leadType)`.
2. **Reserve (HOLD)** on confirm: move estimate from `balance` → `held` atomically.
   Reject if `balance < estimate`.
3. **Consume** as each lead completes: write a `CONSUME` ledger row with the true
   `costUsd`; decrement `held`.
4. **Reconcile** at run end: `RELEASE` any unused hold back to `balance`.
5. **Mid-run exhaustion:** if actuals exceed the hold, pause the run at
   `READY_FOR_REVIEW` for completed leads and prompt top-up for the rest.

All wallet mutations go through a single `creditService` with row-level locking
(`SELECT … FOR UPDATE` / Prisma transaction) to prevent races.

### 9.5 Buying credits
The **$50/month plan** grants 400 credits on each billing cycle (`PURCHASE` ledger
entry). Extend the existing Razorpay/Stripe flow to also sell **one-time top-up
packs** (₹10/credit) when a user runs out. Webhook → `PURCHASE` entry + balance
increment. **No free grant** — new signups start at 0 credits.

### 9.6 Provider float
Money lands in Flowfiy's account; **there is no per-purchase transfer to providers.**
Maintain a prepaid float with Gemini/Apify/Prospeo using their **auto-recharge**
(threshold-triggered). Admin alert on spend spikes. The "50%" is accounting, not a wire.

---

## 10. LLM centralization (Gemini)

- Add a **Gemini provider** to `src/ai/llm.ts` implementing the same `LLMClient`
  interface the orchestrator uses (map tool-calling to Gemini function-calling).
- Make the model **config-driven per task** (replace the hardcoded
  `claude-sonnet-4-5` in `orchestrator.ts`):
  ```ts
  // src/ai/config.ts (proposed)
  export const TASK_MODELS = {
    planner:        "gemini-flash",       // routing + clarification
    research:       "gemini-flash-lite",
    qualification:  "gemini-flash-lite",
    personalization:"gemini-flash",       // quality matters most
  };
  ```
- **Fallback provider (LOCKED: seam now, wire later).** Keep a provider-abstraction
  seam so a backup LLM (e.g. an OpenRouter / OpenAI-compatible endpoint) can be added
  as a config change without touching pipeline code. **Launch Gemini-only**; the
  fallback exists to auto-retry on Gemini outage / rate-limit / model deprecation so
  the whole platform doesn't fail at once. Wire a live fallback in a later phase.
- Remove BYOK branching from `IntegrationCenter` and the pipeline (always CENTRAL).

---

## 11. Actor registry (the tools the LLM can pick)

Curated, **fixed** set with known input/output schemas (do **not** let the LLM
pick arbitrary marketplace actors — cost/output risk). Proposed `src/ai/actors/registry.ts`:

**Launch set (LOCKED): two actors — `google_maps` + `leads_finder`. No LinkedIn at launch.**

```ts
export const ACTORS = {
  google_maps: {
    key: "google_maps",
    apifyActorId: "<maps-actor-id>",
    leadType: "LOCAL",
    description: "Find local businesses by category + location (cafes, gyms, clinics…).",
    paramsSchema: { search: "string", location: "string", maxResults: "number" },
    normalize: (raw) => /* → common Lead shape */,
  },
  leads_finder: {
    key: "leads_finder",
    apifyActorId: "<leads-finder-actor-id>",  // ~$1 per 1,500 leads
    leadType: "B2B",
    description: "Find B2B people/companies by role, industry, geography.",
    paramsSchema: { roles: "string[]", industries: "string[]", location: "string", maxResults: "number" },
    normalize: (raw) => /* → common Lead shape; use Prospeo only if email missing */,
  },
};
```
The planner is shown each actor's `description` + `paramsSchema` and selects one.
Each actor ships a `normalize()` so §8.3 stays uniform. Adding an actor = one
registry entry (no pipeline changes).

---

## 12. API surface (proposed routes)

| Route | Method | Purpose |
|---|---|---|
| `/api/lead-requests` | POST | Create from NL query → returns planner decision (questions or plan) |
| `/api/lead-requests/[id]/clarify` | POST | Submit answers → re-plan |
| `/api/lead-requests/[id]/confirm` | POST | Reserve credits, enqueue run |
| `/api/lead-requests/[id]` | GET | Poll status / progress |
| `/api/lead-requests/[id]/cancel` | POST | Cancel + release held credits |
| `/api/lead-requests/[id]/review` | GET | Generated leads + drafts |
| `/api/lead-requests/[id]/send` | POST | Approve selected → campaign → Gmail |
| `/api/credits` | GET | Wallet balance + ledger |
| `/api/credits/checkout` | POST | Buy a credit pack (Razorpay/Stripe) |

---

## 13. UI components (proposed)

- `LeadRequestComposer` — the single NL input box + submit.
- `ClarificationPanel` — renders `questions[]` (chips / radio / text / stepper).
- `PlanConfirmCard` — human summary, editable params, credit estimate, Run/Edit/Cancel.
- `RunProgress` — live stage progress (discovery → research → qualify → write).
- `LeadReviewTable` — leads + editable drafts + select + Approve & send.
- `CreditBalancePill` + `BuyCreditsModal` — wallet display + top-up.

---

## 14. Guardrails & edge cases

- **No paid call before Run** (confirm gate). Clarification + planning are LLM-only
  (cheap) and themselves metered as a tiny fixed planner cost (or free).
- **Result caps**: enforce a hard `maxResults` ceiling per run; reject/clamp huge requests.
- **Insufficient balance**: block confirm, prompt top-up.
- **Mid-run exhaustion**: finish paid-for leads, pause rest (§9.4).
- **Actor failure / empty results**: surface clearly, release held credits, no charge for failed work.
- **Email validation**: drop invalid/role/suppressed emails (existing `SuppressedEmail`).
- **Dedup**: by email + company domain + maps place-id.
- **Round cap on clarification** (≤2) so users never get stuck in a question loop.
- **Idempotency**: confirm + send endpoints idempotent (guard double-charge / double-send).
- **Compliance**: credits = deferred revenue; GST on purchase; expiry/refund policy stated.

---

## 15. Build phases

1. **Credits foundation** — `CreditWallet`/`CreditLedger`, `creditService`
   (estimate/reserve/consume/release), admin margin view. Meter existing pipeline
   in *observe-only* mode (record true COGS, don't charge) for ~2 weeks to validate.
2. **Gemini centralization** — Gemini provider in `llm.ts`, per-task model map,
   strip BYOK. Pipeline runs on Gemini.
3. **Actor registry + normalize** — registry, normalize functions, generalize
   discovery stage beyond Apollo-only.
4. **Planner + clarification** — planner agent (structured output), clarify loop,
   `ClarificationPanel`.
5. **Confirm + run + review wiring** — plan card, credit reserve, run pipeline,
   review→send.
6. **Buy credits** — credit packs via Razorpay/Stripe, free-grant on signup,
   low-balance prompts, provider auto-recharge + alerts.
7. **Polish** — progress UX, analytics, expiry/refunds, optional auto-send toggle.

---

## 16. Decisions

**Resolved (2026-06-16):**
1. ✅ **Credit value = ₹10.**
2. ✅ **One plan: $50/mo → 400 credits (~800 leads). Target 60% net contribution.**
3. ✅ **Margin = 60% net** (after COGS, fees, GST-passthrough, overhead buffer).
4. ✅ **No free grant.**
5. ✅ **Fallback provider: build the seam, launch Gemini-only**, wire fallback later.
6. ✅ **Actors at launch: `google_maps` + `leads_finder` only** (no LinkedIn).

**Still open:**
- **Income-tax definition** — is 60% a contribution margin (recommended) or net-of-
  corporate-income-tax? The latter shrinks the plan to ~250 credits / ~500 leads.
- **Credit expiry / refund** policy (do unused plan credits roll over or expire monthly?).
- **Planner cost** — charge a tiny credit fee per plan, or absorb (free)?
- **Lead-type spend tiering** — confirm local = 3 / B2B = 1.5 leads per credit
  (vs a single flat 2/credit) to guarantee ≥60% on all-B2B usage.

---

## 17. File-change map (for implementation)

| Area | Files |
|---|---|
| Schema | `prisma/schema.prisma` (+`LeadRequest`, `CreditWallet`, `CreditLedger`, enums) |
| Credits | `src/lib/credits/{service.ts,rates.ts}` (new) |
| LLM | `src/ai/llm.ts`, `src/ai/config.ts`, `src/ai/orchestrator.ts` (model map, Gemini) |
| Actors | `src/ai/actors/registry.ts` (new), `src/ai/tools/{definitions,handlers}.ts` |
| Planner | `src/ai/agents/planner.ts` (new) + prompt |
| Queues | `src/workers/queues.ts`, `src/workers/processors/*` (actor-driven discovery) |
| API | `src/app/api/lead-requests/*`, `src/app/api/credits/*` (new) |
| UI | `src/components/leads/*` (composer, clarify, plan, review), `CreditBalancePill` |
| Billing | extend Razorpay/Stripe checkout + webhooks for credit packs |
| Admin | margin/COGS dashboard (extend `admin/ai-usage`) |

---

### Appendix — worked economics (Gemini + leads-finder/Maps + Prospeo)
Per-lead COGS (conservative ~₹1 / ~$0.012):
- **Local** (Maps ~$0.002 + Gemini ~$0.006, usually no enrichment) ≈ **$0.008 (~₹0.7)**.
- **B2B** (leads-finder ~$0.0007 + Prospeo $0.01 + Gemini ~$0.006) ≈ **$0.017 (~₹1.4)**
  — and *cheaper than local* if the leads-finder actor already returns emails (skip Prospeo).

Plan check ($50, 400 credits, 2 leads/credit = 800 leads): COGS ~$9.6 + fees ~$1.75
+ tax/overhead buffer ~$7.5 = ~$18.85 → **net ~$31 (~62%)**. ✓ ≥60%.

Spend tiers to hold margin on any mix: **local = 3 leads/credit, B2B = 1.5 leads/credit.**
