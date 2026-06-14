/**
 * Structured ICP — single source of truth for the onboarding MCQ questions, the
 * stored answer shape, and the mappings that turn answers into precise lead-search
 * filters (peakydev/Apify) and qualification guidance.
 *
 * Why: free-text ICP produced loose searches and poor lead quality. Structured
 * answers map deterministically to search filters, so we no longer rely on an LLM
 * to "interpret" the ICP for sourcing — only to draft emails (from businessDetails).
 */

export type IcpAnswers = {
  customerType?: string;            // Q1 single
  companySize?: string;             // Q2 single
  countries?: string[];             // Q3 multi
  industries?: string[];            // Q4 multi
  decisionMakers?: string[];        // Q5 multi
  revenueRange?: string;            // Q6 single
  technologies?: string[];          // Q7 multi
  problemSolved?: string;           // Q8 single
  goodSignals?: string[];           // Q9 multi
  avoidCompanies?: string[];        // Q10 multi
  dealSize?: string;                // Q11 single
  qualificationStrictness?: string; // Q12 single
};

export type IcpQuestion = {
  key: keyof IcpAnswers;
  title: string;
  multi: boolean;
  required?: boolean;
  options: string[];
};

export const ICP_QUESTIONS: IcpQuestion[] = [
  { key: "customerType", title: "What type of customers are you looking for?", multi: false, required: true,
    options: ["SaaS Companies", "Marketing Agencies", "E-commerce Brands", "IT Services Companies", "Consulting Firms", "Manufacturing Businesses", "Healthcare Companies", "Financial Services", "Real Estate Companies", "Educational Institutions", "Other"] },
  { key: "companySize", title: "What company size do you want to target?", multi: false, required: true,
    options: ["Solo Founder", "2-10 Employees", "11-50 Employees", "51-200 Employees", "201-1000 Employees", "1000+ Employees"] },
  { key: "countries", title: "Which countries should we search in?", multi: true, required: true,
    options: ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "UAE", "Germany", "France", "Worldwide"] },
  { key: "industries", title: "Which industries should we prioritize?", multi: true, required: true,
    options: ["Artificial Intelligence", "SaaS", "Marketing", "IT Services", "Healthcare", "Finance", "Education", "Manufacturing", "Real Estate", "Legal", "Retail", "E-commerce"] },
  { key: "decisionMakers", title: "Who is the ideal decision maker?", multi: true, required: true,
    options: ["Founder", "CEO", "Co-Founder", "CTO", "CMO", "VP Sales", "Head of Growth", "Marketing Manager", "Operations Manager", "HR Manager", "Other"] },
  { key: "revenueRange", title: "What annual revenue range should we target?", multi: false,
    options: ["Pre-Revenue", "Under $100k", "$100k-$1M", "$1M-$10M", "$10M-$50M", "$50M+"] },
  { key: "technologies", title: "What technologies should these companies be using?", multi: true,
    options: ["HubSpot", "Salesforce", "Apollo", "Zoho", "Shopify", "WordPress", "Webflow", "AWS", "Google Cloud", "OpenAI", "Anthropic", "Doesn't Matter"] },
  { key: "problemSolved", title: "What problem does your solution solve?", multi: false, required: true,
    options: ["Lead Generation", "Sales Automation", "Marketing Automation", "Cost Reduction", "AI Implementation", "Customer Support", "Recruitment", "Productivity", "Operations", "Other"] },
  { key: "goodSignals", title: "Which signals indicate a good prospect?", multi: true,
    options: ["Recently Raised Funding", "Hiring Sales Team", "Hiring Marketing Team", "Active on LinkedIn", "Running Paid Ads", "Growing Team Size", "New Product Launch", "Recently Rebranded", "Expanding to New Markets"] },
  { key: "avoidCompanies", title: "Which companies should we avoid?", multi: true,
    options: ["Agencies", "Startups", "Enterprises", "Government Organizations", "Nonprofits", "Educational Institutions", "Competitors"] },
  { key: "dealSize", title: "What is your average deal size?", multi: false,
    options: ["Under $100", "$100-$500", "$500-$2k", "$2k-$10k", "$10k-$50k", "$50k+"] },
  { key: "qualificationStrictness", title: "How aggressive should prospect qualification be?", multi: false, required: true,
    options: ["Very Strict (Only Top Fits)", "Balanced", "Broad Search"] },
];

// ─── Mappings: structured answers → lead-search filters ──────────────────────

/** Q5 decision-maker labels → searchable job titles (free-text personTitle). */
export function icpJobTitles(a: IcpAnswers): string[] {
  const t = (a.decisionMakers ?? []).filter((d) => d && d !== "Other");
  return t.length ? t : ["Founder", "CEO"];
}

/** Q5 → peakydev `seniority` enum values (best-effort). */
export function icpSeniority(a: IcpAnswers): string[] {
  const MAP: Record<string, string> = {
    Founder: "Founder", "Co-Founder": "Founder", CEO: "CEO", CTO: "CXO", CMO: "CXO",
    "VP Sales": "Vice President", "Head of Growth": "Head",
    "Marketing Manager": "Manager", "Operations Manager": "Manager", "HR Manager": "Manager",
  };
  return [...new Set((a.decisionMakers ?? []).map((d) => MAP[d]).filter(Boolean))];
}

/** Q2 company size → peakydev `companyEmployeeSize` enum. */
export function icpEmployeeSize(a: IcpAnswers): string[] {
  const MAP: Record<string, string> = {
    "Solo Founder": "0 - 1", "2-10 Employees": "2 - 10", "11-50 Employees": "11 - 50",
    "51-200 Employees": "51 - 200", "201-1000 Employees": "201 - 500", "1000+ Employees": "1001 - 5000",
  };
  const v = a.companySize ? MAP[a.companySize] : null;
  return v ? [v] : [];
}

/** Q3 countries → peakydev `personCountry` enum (drops Worldwide). */
export function icpCountries(a: IcpAnswers): string[] {
  const MAP: Record<string, string> = {
    India: "India", "United States": "United States", "United Kingdom": "United Kingdom",
    Canada: "Canada", Australia: "Australia", Singapore: "Singapore",
    UAE: "United Arab Emirates", Germany: "Germany", France: "France",
  };
  return [...new Set((a.countries ?? []).map((c) => MAP[c]).filter(Boolean))];
}

/** Q4 industries → free-text industry keywords (peakydev `industryKeywords`). */
export function icpIndustryKeywords(a: IcpAnswers): string[] {
  return (a.industries ?? []).filter(Boolean);
}

/** Q6 revenue → peakydev `revenue` enum. */
export function icpRevenue(a: IcpAnswers): string[] {
  const MAP: Record<string, string> = {
    "Pre-Revenue": "< 1M", "Under $100k": "< 1M", "$100k-$1M": "< 1M",
    "$1M-$10M": "1M-10M", "$10M-$50M": "11M-100M", "$50M+": "101M-500M",
  };
  const v = a.revenueRange ? MAP[a.revenueRange] : null;
  return v ? [v] : [];
}

/** Q9 "Recently Raised Funding" signal → peakydev recent funding types. */
export function icpFundingTypes(a: IcpAnswers): string[] {
  return (a.goodSignals ?? []).includes("Recently Raised Funding")
    ? ["Seed Round", "Pre Seed Round", "Venture Round", "Angel Round", "Funding Round"]
    : [];
}

/** Q12 strictness → minimum qualification score to keep a lead. */
export function icpMinScore(a: IcpAnswers): number {
  switch (a.qualificationStrictness) {
    case "Very Strict (Only Top Fits)": return 75;
    case "Broad Search": return 40;
    default: return 60; // Balanced
  }
}

/** A compact human-readable ICP summary for prompts / legacy icpDescription. */
export function icpSummary(a: IcpAnswers): string {
  const parts: string[] = [];
  if (a.customerType) parts.push(`Customer type: ${a.customerType}`);
  if (a.industries?.length) parts.push(`Industries: ${a.industries.join(", ")}`);
  if (a.decisionMakers?.length) parts.push(`Decision makers: ${a.decisionMakers.join(", ")}`);
  if (a.companySize) parts.push(`Company size: ${a.companySize}`);
  if (a.countries?.length) parts.push(`Countries: ${a.countries.join(", ")}`);
  if (a.revenueRange) parts.push(`Revenue: ${a.revenueRange}`);
  if (a.technologies?.length && !a.technologies.includes("Doesn't Matter")) parts.push(`Uses: ${a.technologies.join(", ")}`);
  if (a.goodSignals?.length) parts.push(`Good signals: ${a.goodSignals.join(", ")}`);
  if (a.avoidCompanies?.length) parts.push(`Avoid: ${a.avoidCompanies.join(", ")}`);
  if (a.problemSolved) parts.push(`Problem solved: ${a.problemSolved}`);
  return parts.join(". ");
}
