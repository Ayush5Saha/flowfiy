# Lead Sourcing — Flowfiy Outbound Operator

Target: Indian B2B companies (SaaS / IT services / agencies / consulting / staffing) with 10–500 employees that need outbound sales automation.

---

## Tool 1 — Vibe Prospecting MCP (Primary)

Use `mcp__Vibe_Prospecting__*` tools. Fast, structured B2B company + people data.

**Workflow:**
```
1. fetch-entities → search for companies matching ICP
2. enrich-business → get company details (website, size, industry)
3. match-prospects → find decision-makers at those companies
4. enrich-prospects → get email, phone, LinkedIn for each person
5. export-to-csv → optionally export batch for logging
```

**Entity search parameters for Flowfiy ICP:**
- Industry: "SaaS", "Software", "IT Services", "Digital Marketing", "Consulting", "Staffing", "Marketing Agency"
- Country: India
- Employee range: 10–500
- Keywords: "outbound sales", "B2B", "lead generation", "sales team", "SDR", "business development"

**Prospect title filters (run separately per company):**
- "VP Sales" OR "Head of Sales" OR "Sales Director" OR "Director of Sales"
- "Head of Growth" OR "VP Growth" OR "Growth Manager"
- "Founder" OR "Co-founder" OR "CEO" (for companies under 50 employees)
- "Chief Revenue Officer" OR "CRO"

**Cities to target:**
Bengaluru, Mumbai, Delhi, Gurugram, Noida, Pune, Hyderabad, Chennai, Ahmedabad, Kolkata

---

## Tool 2 — Apollo MCP (Secondary)

Use `mcp__8b938796-fb6b-4913-8eae-e5aec2216564__*` tools.

**People search — best for finding decision-makers:**
```
apollo_mixed_people_api_search with:
  - person_titles: ["VP Sales", "Head of Sales", "Sales Director", "Head of Growth", "Founder", "CEO"]
  - organization_locations: ["India"]
  - organization_num_employees_ranges: ["10,50", "51,200", "201,500"]
  - q_keywords: "outbound sales OR lead generation OR B2B SaaS OR IT services"
```

**Company enrichment — once you have a company name:**
```
apollo_organizations_enrich → gets website, size, industry, LinkedIn
apollo_people_match → get specific person's contact details
apollo_people_bulk_match → batch enrich multiple contacts
```

**Apollo search categories to run separately:**
1. SaaS companies India (10–200 employees) — search VP/Head of Sales
2. IT services / software agencies India — search Founders
3. Digital marketing agencies India (10–100 employees) — search Founders/CEOs
4. Consulting firms India — search Founders/Managing Directors
5. Staffing agencies India — search Founders/CEOs

**Contact fields to extract:**
- `name`, `title`, `email`, `phone_numbers`, `linkedin_url`
- `organization.name`, `organization.website_url`, `organization.num_employees`

---

## Tool 3 — Apify (Tertiary)

Use `mcp__cd858447-e92d-4641-a017-031a7a8e0332__*` for deeper scraping when Apollo/Vibe don't have enough data.

**Best actors for this use case:**

| Need | Search Query | Use |
|---|---|---|
| LinkedIn company search | "linkedin company scraper india" | Find companies + team sizes |
| LinkedIn people search | "linkedin sales navigator scraper" | Find decision-makers |
| Website contact scraper | "email extractor website" | Find emails from company website |
| Google Maps India business | "google maps scraper" | Local companies in specific cities |
| Glassdoor/jobs scraper | "glassdoor jobs scraper" | Find companies hiring sales roles |

**Standard Apify call pattern:**
```
1. mcp__cd858447-e92d-4641-a017-031a7a8e0332__fetch-actor-details (actorId)
   → read required input schema
2. mcp__cd858447-e92d-4641-a017-031a7a8e0332__call-actor (actorId + inputs)
   → kick off the run
3. mcp__cd858447-e92d-4641-a017-031a7a8e0332__get-actor-run (runId)
   → poll until status = SUCCEEDED
4. mcp__cd858447-e92d-4641-a017-031a7a8e0332__get-dataset-items (datasetId)
   → extract results
```

**Code crafter leads finder (fastest for direct leads):**
```
mcp__cd858447-e92d-4641-a017-031a7a8e0332__code_crafter--leads-finder
Input: industry + location + job title
```

---

## Tool 4 — Web Search (Fallback)

Use for:
- Finding companies in a specific niche (e.g., "B2B SaaS company Pune sales team")
- Verifying company details
- Finding founder emails from public sources

**Useful search patterns:**
- `site:linkedin.com/in "VP Sales" "India" "SaaS"`
- `"[company name]" founder email contact`
- `"head of sales" "Bengaluru" "SaaS company" linkedin`
- `clutch.co India IT services agencies`

---

## Contact Discovery — Phone / WhatsApp Priority

After finding a company, locate decision-maker contact in this priority order:

1. Apollo phone enrichment (`apollo_people_match` — phone_numbers field)
2. Vibe Prospecting enrichment (`enrich-prospects` — phone field)
3. Company website (team page, contact page, about page)
4. LinkedIn profile (contact info tab — sometimes shows phone)
5. Google search: `"[person name]" "[company]" phone OR WhatsApp OR mobile`
6. Apify website email/contact scraper

**Phone number formatting:**
- Strip spaces, dashes
- Add +91 prefix for India numbers (if not already present)
- A 10-digit number starting with 6/7/8/9 is almost certainly a mobile (WhatsApp-capable)

---

## Deduplication

Before proceeding to Step 3 (gap analysis):
- Remove duplicate contacts (same email or same name + company)
- Remove contacts already in `pipeline/flowfiy-outbound-pipeline.xlsx`
- Remove non-India companies
- Remove obvious B2C companies

---

## Batch Size Guidance

| Run Type | Target Leads |
|---|---|
| Quick run (test) | 5–8 leads |
| Standard daily run | 15–20 leads |
| Full prospecting session | 25–30 leads |

Start with the tools most likely to yield direct contact data (Apollo + Vibe). Use Apify for enrichment or when initial tools come up empty.
