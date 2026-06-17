# Hacker News — Show HN

**Title:**
Show HN: Flowfiy – describe leads in plain English; a managed AI pipeline finds, scores, and writes the outreach

**Body:**

Hey HN,

I built Flowfiy (flowfiy.com) — a natural-language B2B outbound pipeline. You describe the leads you want in plain English (including qualitative conditions like "cafés with no website"), and it does discovery → research → qualification → personalization end-to-end.

**The pipeline:**

1. Planner (Gemini) — turns the request into a search plan + a list of criteria predicates; asks ≤3 clarifying questions (≤2 rounds) if it's too vague
2. Criteria engine — each predicate routes to the cheapest evaluator: source (pushed into the actor query), attribute (computed from results), signal (active probe, e.g. a website-audit grading none/broken/slow/outdated), or judge (LLM for fuzzy conditions). Funnel order narrows the set before the expensive checks
3. Discovery — Apify actors (Google Maps + a B2B people finder), run via a platform token, normalized + deduped + criteria-aware quality gate
4. Research + Qualify (Gemini) — reads each site/public data, scores 0–100 with reasoning
5. Personalize (Gemini) — subject line + 3-touch sequence per qualified lead, grounded in the research

**Technical decisions worth sharing:**

- Planner emits a typed plan (actor + params + criteria IR) so the run is deterministic and the user can confirm before anything paid happens
- temperature=0 + hard input caps to make spend predictable; agents return real token usage
- Cost-plus credit metering: estimate → reserve (HOLD) → reconcile actual COGS at run end (CONSUME + RELEASE). Empty runs charge nothing. AI/data are managed centrally (Gemini + Apify + Prospeo), so there's no BYOK friction
- Gmail OAuth for sending — follow-ups go out as replies in-thread; reply detection stops the sequence; timezone-aware send windows

**Stack:** Next.js 15 / Supabase / Prisma / BullMQ + Upstash / Gemini / Railway (workers) / Vercel (app)

**What I'm unsure about:**
- Whether the qualification threshold (70/100) is too aggressive by default
- Whether running the website-audit signal on every survivor is worth the latency vs. sampling
- Whether "review before send" is the right UX or if fully autonomous sends would convert better

First 100 leads are free on credits (no subscription). Would genuinely appreciate feedback on the architecture or the product.
