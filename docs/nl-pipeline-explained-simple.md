# Flowfiy's New Lead System — Explained Simply

> A plain-English guide to the big upgrade we're planning.
> If you want the deep technical version, see
> [`nl-lead-pipeline-implementation-plan.md`](./nl-lead-pipeline-implementation-plan.md).
> Last updated: 2026-06-16

---

## First, the 30-second version

Today, to use Flowfiy you have to plug in your own "keys" (accounts) for the
tools it uses, and it can feel complicated.

We're changing it so you can just **type what kind of customers you want in plain
English** — like texting a friend — and Flowfiy does the rest. You pay using
**credits** (think arcade tokens or a mobile recharge), and you only ever pay for
what you actually get.

That's the whole idea. The rest of this document explains how.

---

## Some words we'll use (quick glossary)

- **Lead** = a possible customer (a business or a person you might sell to).
- **Qualified lead** = a *good* possible customer that actually fits what you sell.
- **Credits** = Flowfiy's in-app money. You buy credits, then spend them to find leads.
- **Our cost (COGS)** = what it costs *Flowfiy* to find one lead (paying the AI and
  the data tools behind the scenes).
- **Profit margin** = the part of the price that's profit after costs. "60% profit"
  means: out of every ₹100 you pay, ₹60 is profit and ₹40 is our cost + fees.

---

## What's changing — before vs after

| | Before (now) | After (the upgrade) |
|---|---|---|
| How you start | Fill forms, plug in your own tool accounts ("keys") | Just **type what you want** in plain English |
| Who pays for the tools | **You** (your own accounts) | **Flowfiy** pays for everything; you just spend credits |
| The AI | You sometimes bring your own | One smart AI (Google's Gemini) runs it for everyone |
| How you're charged | Confusing "generation" limits | Simple **credits** — pay for the leads you get |
| Finding picky leads | Not really possible | Type **any condition** and it finds exactly that |

The old "Generate Leads" button is being **replaced** by the new "type what you
want" box.

---

## The new experience, step by step

Imagine you run a web-design business and you type:

> "Find coffee shops in Mumbai that don't have a website."

Here's what happens:

1. **You describe it** in the text box. (Nothing is charged yet.)
2. **The AI reads it and may ask a few quick questions** if it needs to — like
   "How many leads do you want?" or "Only ones with a public email?" It asks at
   most 3 questions, and at most twice, so you're never stuck answering forever.
3. **It shows you a plan + a price** before doing anything: *"I'll search Google
   Maps for coffee shops in Mumbai with no website, up to 200 results. Estimated
   cost: 67 credits. You'll have 315 left."*
4. **You click "Run."** This is the only moment money (credits) gets set aside.
   Before this click, **nothing is ever charged.**
5. **It works in the background:** finds the businesses → researches each one →
   scores them → writes a personalized email for the good ones.
6. **You review the emails**, tick the ones you like, and click **"Approve & send."**
   The emails go out from your own Gmail.

That's it. You went from one sentence to ready-to-send personalized emails.

---

## The clever part: finding *any* kind of lead

This was a big focus. People don't just ask for "coffee shops." They ask for very
specific things, like:

- "small businesses with **no website**"
- "shops with a **slow or buggy website**"
- "dentists with **bad Google reviews**"
- "stores **running Facebook ads** but with a **weak website**"
- "restaurants that **look high-end**"
- "companies that **recently raised money**"

We can't possibly pre-program every sentence a person might type. So instead we
built a **smart filter** that can handle *anything*. It works like this — for each
condition you give, it picks the cheapest, smartest way to check it:

1. **Ask the source directly.** Some conditions (location, industry, company size)
   can be handled right when searching — like using filters on a shopping website.
2. **Look at info we already have.** Things like star rating or number of reviews
   come back with the search, so we just read them. Free and instant.
3. **Go check the thing itself.** For "no website" or "slow website," we actually
   visit the website (or notice there isn't one) and grade it.
4. **Let the AI judge.** For fuzzy stuff like "looks high-end," the AI looks at the
   business and makes a call, just like a person would.

**The safety net:** if someone types a condition we've never seen before, it
automatically goes to method #4 (the AI judges it). So the system *never* just
ignores what you asked — it always tries. And on the plan screen, it tells you
*how* it will check each thing, and warns you if something can't be checked
reliably.

### Example: the "website checker"
For website conditions, Flowfiy grades each business's site as:
- **None** — they don't have a website at all
- **Broken** — the site doesn't load / is down
- **Slow** — the site takes too long to load
- **Outdated** — old-looking, not mobile-friendly, no secure lock (HTTPS), etc.

This is great for web designers and agencies — these are exactly the businesses
that *need* their service.

---

## How credits and pricing work

This is the part we spent the most time getting right, so it's fair to you and
sustainable for Flowfiy.

### Buying credits
- There's **one plan: $50/month**, which gives you **400 credits** (roughly
  **800 leads**, depending on what you search for).
- If you run out before the month ends, you can **buy more credits anytime** — but
  only if you already have the $50 plan. (No plan = subscribe first.)
- New users start with **0 credits**; you buy the plan to begin.

### How much each search costs (the smart part)
Instead of guessing, Flowfiy charges based on **what the search actually cost**,
and only counts the **good (qualified) leads** you got:

> **After each run:** take what it really cost us, divide by the number of good
> leads delivered, then add our profit on top.

A few important promises baked in:

- **You see the most it could cost before you say yes.** The price shown is a
  **ceiling** — you can be charged that or *less*, **never more**.
- **You only pay for good leads.** If a search digs through 200 businesses to find
  50 good ones, the cost of checking all 200 is spread across those 50 — you're not
  charged separately for the rejects.
- **If a search finds nothing, you pay nothing.** Zero good leads = zero credits,
  and your reserved credits come straight back.
- **Harder searches cost a bit more per lead.** Picky conditions (like "must have a
  bad website") take more work to find, so they cost a little more each — and the
  app shows you that upfront.

### The "60% profit" rule
Flowfiy aims to keep **60% real profit** on every search (after paying the AI,
the data tools, and the payment-processing fee). In simple terms: if a search
costs us ₹40 to run, we charge about ₹100 worth of credits for it. That keeps the
business healthy so it can keep running.

(Quick real example: a tough "coffee shops with no website" search that checks ~200
shops to deliver 50 good leads ends up costing about **31 credits for 50 leads** —
roughly 1.6 leads per credit.)

---

## What we're keeping vs. building

We're **not** throwing away the working parts. We're reusing the engine that
already finds, researches, scores, and emails leads — and the Gmail sending, the
billing system, and the dashboard look. We're **adding**:

- The "type what you want" box and the question/plan/review screens.
- The credit wallet and the fair pricing system above.
- The smart filter that understands any condition.
- The switch to one central AI so you don't need your own keys.

---

## We're also updating the website and content

Right now the public website, pricing page, and blog all describe the *old* way
(old plans, "bring your own keys," etc.). When the new system launches, all of
that needs to match the new story:

- **Pricing page** → the simple $50 / 400-credit plan.
- **Homepage & ads** → the new promise: "Describe the leads you want."
- **Blog posts** → fix or rewrite the ones that talk about the old key-based pricing.
- **Help/setup pages** → no more "plug in your keys" steps.
- **Legal pages** (terms, privacy, refunds) → explain credits, refunds, and the new
  tools we use behind the scenes. (Important for following the rules.)

---

## The plan to build it (in order)

We'll build it in clear stages so each part can be tested before the next:

1. **Credits system** — the wallet and the fair pricing math.
2. **Switch to the central AI** (Gemini) so no one needs their own keys.
3. **The lead finder + smart filter** that understands conditions.
4. **The AI planner** that reads your request and asks smart questions.
5. **Connect it all** — confirm, run, review, send.
6. **Buying credits** — the plan + top-ups.
7. **Polish** — more condition types, an admin dashboard, small touches.
8. **Update the website, blog, and legal pages** to match — done at launch.

---

## A few things still to decide

These are small and won't change the overall design:

- Businesses with **no website often have no email** either — should we still keep
  them (you'd contact them by phone), or skip them? (Leaning: keep them, clearly
  labeled.)
- The exact line for what counts as a "slow" or "outdated" website.
- Whether a deeper website health-check becomes an optional paid extra later.

---

## The one-line summary

**Type what customers you want → Flowfiy finds, checks, and writes to exactly
those → you review and send → you pay fair credits only for the good leads you
actually get.**
