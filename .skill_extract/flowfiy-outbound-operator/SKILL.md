---
name: flowfiy-outbound-operator
description: >
  Operates Flowfiy's complete autonomous outbound sales pipeline with zero human intervention.
  Triggers on ANY of these: "find leads for flowfiy", "run flowfiy outbound", "pitch companies on flowfiy",
  "find sales heads to pitch", "find flowfiy ICP", "run the outbound operator", "find contacts and pitch them",
  "start the sales pipeline", "find people to sell flowfiy to", "research prospects for flowfiy",
  "send flowfiy pitch", "run outbound for flowfiy", "find companies that need flowfiy",
  "find sales directors to email", "automate flowfiy sales", "get me leads for flowfiy".
  This skill runs the FULL pipeline autonomously — ICP filtering → lead discovery → company research →
  gap analysis → contact enrichment → personalized email via Gmail → WhatsApp via Chrome/browser →
  CRM logging. Always use this skill when the user asks to find leads, pitch prospects, or run any
  part of Flowfiy's outbound sales motion — even if only one step is mentioned.
---

# Flowfiy Outbound Operator

An autonomous AI sales operator that finds Flowfiy's ideal customers, researches them, personalizes outreach, and executes via email and WhatsApp — no human input needed after launch.

---

## About Flowfiy

**Flowfiy** is an AI-powered outbound sales platform built for India.

**Core product:** A 5-agent automated pipeline that runs end-to-end outbound:
1. **Agent 1 — ICP Profiler:** Defines and refines ideal customer profile
2. **Agent 2 — Lead Discovery:** Finds matching companies via Apollo / Apify
3. **Agent 3 — Company Researcher:** Deep research on each company (website, tech stack, hiring, news)
4. **Agent 4 — Lead Scorer:** Qualifies and prioritizes leads by fit score
5. **Agent 5 — Personalized Email Writer:** Generates and sends custom cold emails via Gmail

**Key USPs to lead with in every pitch:**
- **End-to-end in one run** — not 5 separate tools stitched together; one click, full pipeline
- **Claude AI-native** — all intelligence runs on Anthropic's Claude (strongest reasoning model)
- **India-first pricing** — starts at ₹1,700/mo (vs. $200-500/mo for Apollo+Clay+Instantly)
- **BYOK (Bring Your Own Key)** — enterprises use their own Anthropic API key, no markup
- **Radical cost advantage** — at scale, 10x cheaper than the Western stack

**Pricing tiers:** ₹1,700 / ₹3,900 / ₹7,900 / ₹14,900 / ₹24,900 per month

**Demo CTA:** `flowfiy.co` — "Book a free 15-min demo"

---

## Ideal Customer Profile (ICP)

Target companies that would benefit from automating their outbound sales:

**Company types (primary targets):**
- SaaS companies (Indian B2B SaaS)
- IT services & software development firms
- Digital marketing / performance marketing agencies
- Consulting & advisory firms
- Staffing & recruitment agencies
- RevOps / sales enablement agencies

**Company size:** 10–500 employees (sweet spot: 15–150)

**Geography:** India (primary) — Bengaluru, Mumbai, Delhi/NCR, Pune, Hyderabad, Chennai, Ahmedabad

**Decision-makers to target:**
| Company Size | Primary Target | Fallback |
|---|---|---|
| 10–50 employees | Founder / Co-founder / CEO | Head of Growth |
| 50–200 employees | VP Sales / Head of Sales / Sales Director | Founder |
| 200–500 employees | Head of Growth / VP Marketing / Sales Director | CMO |

**Strong fit signals:**
- Company has a sales team (even 1–3 people)
- Currently using Apollo, Hunter, Instantly, Clay, Lemlist, or Mailshake
- Has a SDR/BDR role or "outbound" in job titles on LinkedIn
- Active hiring for sales roles (signals scaling outbound)
- SaaS product with clear B2B customer acquisition need
- Consulting firm that serves B2B clients and needs leads
- Agency with defined niche (vertical-specific outreach would be high-value)

**Disqualify:**
- B2C companies
- Companies outside India
- Pre-product startups (no customer to sell to yet)
- Enterprise companies with in-house sales ops teams (too complex/slow)
- Companies already using Flowfiy
- Non-decision makers

---

## THE PIPELINE (12 Steps)

### STEP 1 — Source Leads

**Tool priority order:**
1. **Vibe Prospecting MCP** (`mcp__Vibe_Prospecting__*`) — primary, fast B2B company discovery
2. **Apollo MCP** (`mcp__8b938796-fb6b-4913-8eae-e5aec2216564__*`) — secondary, contact-level search
3. **Apify** (`mcp__cd858447-e92d-4641-a017-031a7a8e0332__*`) — tertiary, scrape LinkedIn/websites
4. **Web search** — fallback for specific industries or niches

Target: **15–20 qualified contacts per run**

→ See `references/lead-sourcing.md` for tool-specific search parameters and instructions.

---

### STEP 2 — Research Each Company

For each company found, collect:
- Company name, website, industry, employee count, city
- What they sell and who they sell to (B2B or B2C check)
- Current sales process signals (outbound visible? SDR roles? Apollo/Clay on job listings?)
- Tech stack signals (check BuiltWith or job listings for tools they use)
- Recent growth signals — hiring, funding, product launches, new markets
- Digital presence quality (website, LinkedIn company page, blog activity)
- Lead generation maturity — inbound/content strategy? Clearly structured outbound?

**Priority data to find:**
- Decision-maker: full name, job title
- Email address (work or personal)
- Phone / WhatsApp number
- LinkedIn profile URL

**Contact discovery order:**
1. Vibe Prospecting enrichment (`enrich-prospects`)
2. Apollo people search / enrichment
3. Company website (team/about/contact page)
4. LinkedIn profile (contact info section)
5. Google search: `"[Name]" "[Company]" email`
6. Apify contact scraper actors

---

### STEP 3 — Business Gap Analysis *(Core step — never skip)*

The gap analysis is what separates a great outreach from spam. Research each company deeply and answer:

> "Does this company genuinely need Flowfiy, and why right now?"

**Analyze for these Flowfiy-relevant gaps:**

| Gap Signal | What to Look For |
|---|---|
| **Manual prospecting** | No evidence of outbound tooling; founders/sales reps manually doing BD |
| **Fragmented stack** | Using 3–5 separate tools (Apollo + Clay + Instantly + CRM + Google Sheets) |
| **No personalization** | Generic mass email evidence (Mailchimp-style newsletters to B2B prospects) |
| **Low-velocity outreach** | Small sales team trying to reach hundreds of prospects manually |
| **High tool cost** | Western tools at $200–500/mo for an Indian company — obvious ROI case |
| **SDR bottleneck** | 1 SDR trying to do research + write + send + follow up — burning out |
| **Agency outreach need** | Agency that helps clients with B2B outreach — could use Flowfiy for clients |
| **Recent scaling signal** | Hiring sales roles, raising funds, expanding to new verticals |

**Gap scoring — score each:**
- Strong gap (multiple signals): +3
- Clear gap (single strong signal): +2
- Weak gap (one vague signal): +1
- No gap detected: Disqualify

**Reject if:**
- Company is purely B2C
- Company's main revenue doesn't depend on outbound/BD
- Company has a clearly sophisticated, mature outbound system already
- Not based in India

---

### STEP 4 — Lead Qualification

Only proceed to outreach if ALL of these are true:
- Indian company, B2B business model
- Matches ICP vertical (SaaS / IT services / agency / consulting / staffing)
- Size 10–500 employees
- A real Flowfiy-relevant gap was identified in Step 3
- Decision-maker contact found (email at minimum)

**Qualification output per lead:**
```
Qualified: Yes / No
Score: [X/10]
Company: [name]
Decision-maker: [name + role]
Gap identified: [specific evidence-backed gap]
Outreach angle: [concrete hook tied to real observation]
Email available: Yes / No
WhatsApp available: Yes / No
```

---

### STEP 5 — Personalized Outreach Generation

Generate for each qualified lead:
1. **Email** — always generate
2. **WhatsApp message** — only if phone/WhatsApp number found

**Email style rules:**
- Founder-to-founder / peer-to-peer tone
- Short — under 120 words in the body
- Reference ONE real, specific thing about their business
- Connect that observation to the gap Flowfiy solves
- End with a single soft CTA (15-min demo)
- Never generic — no "I hope this finds you well", no "revolutionary AI-powered"
- Sign as: "— [Founder name]" or just "Flowfiy team"

**WhatsApp rules:**
- Max 80 words total
- Short paragraphs, conversational, casual
- Name their company specifically
- One soft CTA — never two asks
- Do NOT use jargon or buzzwords

→ See `references/outreach-templates.md` for email/WhatsApp frameworks, examples, and subject line bank.

---

### STEP 6 — Email Execution

Use **Gmail MCP** (`mcp__cb36f579-d082-4c9d-9065-9543b4a33644__*`) to send emails.

**Steps:**
1. Compose personalized email with subject line and body
2. Use `create_draft` to create the email draft
3. Verify draft was created successfully
4. Log email status in CRM

**Daily limit:** Max 30 emails/day — respect this to avoid Gmail rate limits.

**Important:** Actually send or draft — do not just generate text. Execute the Gmail MCP tool call.

---

### STEP 7 — WhatsApp Execution

Use **Chrome MCP** (`mcp__Claude_in_Chrome__*`) to send WhatsApp messages via web.whatsapp.com.

**Steps:**
1. Navigate to `https://web.whatsapp.com`
2. Use `navigate` tool to open the new chat URL: `https://wa.me/[phone_number_with_country_code]`
3. Wait for page to load
4. Find message input field
5. Type the prepared WhatsApp message
6. Send the message
7. Log WhatsApp status in CRM

**Phone number format:** Always use country code. India = +91XXXXXXXXXX

**Skip WhatsApp for any contact where:**
- No phone number was found
- Phone number looks like a landline (unlikely to be on WhatsApp)
- Number is from an unknown country

**Daily limit:** Max 20 WhatsApp messages/day.

---

### STEP 8 — Follow-Up Scheduling

After first outreach, note follow-up timing:

| Timeline | Follow-up Action |
|---|---|
| 48 hours with no reply | Follow-up #1 — bump the thread |
| 4 days no reply | Follow-up #2 — add a bit of value |
| 7 days no reply | Final follow-up — close the loop |

Follow-ups: very short, casual, never pushy, always in the same email thread.

---

### STEP 9 — Reply Handling

When a prospect replies:
- Analyze intent: interested / objecting / asking questions / unsubscribe request
- For **interested replies**: move toward booking a demo — use Google Calendar MCP if available
- For **objections**: respond thoughtfully with insight, not pushback
- For **pricing questions**: deflect to demo first, show value before numbers
- For **unsubscribe/not interested**: acknowledge gracefully, update CRM, do not follow up

---

### STEP 10 — Meeting Booking

For interested prospects, propose demo slots:
1. Offer 2–3 available time slots
2. Or direct to: `https://flowfiy.co` to self-book
3. Confirm the meeting time via email
4. Update CRM with meeting date

---

### STEP 11 — CRM Logging

After every action, log to the pipeline tracking file.

**File:** `pipeline/flowfiy-outbound-pipeline.xlsx` (create if doesn't exist)

| Column | Values |
|---|---|
| Date Added | Date of first contact |
| Contact Name | Full name |
| Company | Company name |
| Role | Job title |
| Company Type | SaaS / IT Services / Agency / Consulting / Staffing |
| City | City in India |
| Website | Company URL |
| Email | Contact email |
| WhatsApp | Number if found |
| Lead Source | Vibe / Apollo / Apify / Manual |
| Qualification Score | 1–10 |
| Gap Identified | Evidence-backed gap description |
| Email Status | Not Sent / Drafted / Sent / Bounced |
| WA Status | Not Sent / Sent / No Number |
| Follow-up Stage | None / FU1 / FU2 / Final |
| Reply Status | No Reply / Interested / Not Interested / Maybe Later |
| Meeting Booked | Yes / No |
| Meeting Date | Date |
| Notes | Observations, context |

---

### STEP 12 — Run Summary

After completing the pipeline, print a clean summary:

```
=== FLOWFIY OUTBOUND RUN SUMMARY ===
Date: [date]
Leads researched: [N]
Qualified leads: [N]
Emails sent/drafted: [N]
WhatsApp sent: [N]
Skipped (no contact): [N]
Skipped (no gap): [N]

Top leads this run:
1. [Name] @ [Company] — [gap identified] — Email: Sent / WA: Sent
2. [Name] @ [Company] — [gap identified] — Email: Sent / WA: No number
...

CRM updated: pipeline/flowfiy-outbound-pipeline.xlsx
```

---

## Core Operating Rules

1. **No gap = no outreach** — every message must reference something real and observed
2. **Execute, don't simulate** — actually call Gmail MCP and Chrome MCP tools; don't just write message drafts as text
3. **India-first context** — always frame Flowfiy's value in INR pricing and India market context
4. **Quality over volume** — 8 sharp, well-researched pitches beat 40 generic blasts
5. **Personalization is mandatory** — if you can't personalize it, skip that lead
6. **Continue on errors** — if WhatsApp fails for one contact, log the error and continue to the next
7. **Respect daily limits** — 30 emails/day, 20 WhatsApp/day

---

## Reference Files

- `references/lead-sourcing.md` — Vibe Prospecting, Apollo, Apify search parameters for India B2B companies
- `references/gap-analysis.md` — Deep framework for identifying Flowfiy-relevant sales automation gaps
- `references/outreach-templates.md` — Email & WhatsApp message frameworks, examples, and subject line bank
