/**
 * Single source of truth for every fact rendered on the Routcore page.
 *
 * Routcore is not a menu of fixed packages — it's one custom AI system,
 * built around how a business already runs. Outbound and lead follow-up
 * are one area among several (support, admin, invoicing, operations).
 * Deliberately no rate or charge language lives here: specifics are
 * discussed on the consultation call, never asserted on the page. See §2
 * of the redesign plan for the exact banned-word list this file (and every
 * component that reads it) must stay clear of.
 */

export const CONTACT = {
  email: "info@flowfiy.com",
  whatsappHref: "https://wa.me/919394659992",
  founders: [
    { name: "Ayush Saha", phone: "+91 93946 59992", phoneHref: "+919394659992" },
    { name: "Yaswanth Alok", phone: "+91 97879 30278", phoneHref: "+919787930278" },
  ],
} as const;

/** Animated stats under the manifesto. `prefix`/`suffix` wrap the counted number. */
export const STATS = [
  { value: 24, prefix: "", suffix: "/7", label: "Always running, no leave or attrition" },
  { value: 100, prefix: "", suffix: "%", label: "Custom built for your process" },
  { value: 0, prefix: "", suffix: "", label: "Extra hires as your volume grows" },
  { value: 1, prefix: "<", suffix: " min", label: "Enquiry reply time" },
] as const;

/** "Where the time leaks" — six hover rows, two columns each. */
export const LEAKS = [
  {
    n: "01",
    what: "The same work, repeated every day",
    means: "Your people spend their day on invoices, data entry, reports and replies software can do.",
  },
  {
    n: "02",
    what: "Enquiries answered hours or days later",
    means: "The business goes to whoever replied first.",
  },
  {
    n: "03",
    what: "Follow-ups missed",
    means: "Money already earned, never collected.",
  },
  {
    n: "04",
    what: "Growth means hiring",
    means: "Every jump in volume needs another person.",
  },
  {
    n: "05",
    what: "Tools that don't talk to each other",
    means: "Hours lost copying data between systems — and the mistakes that follow.",
  },
  {
    n: "06",
    what: "The process lives in one person's head",
    means: "Everything stops when they're away or they leave.",
  },
] as const;

/** The [01]–[06] areas accordion. */
export const AREAS = [
  {
    n: "01",
    title: "Sales & lead follow-up",
    body: "Enquiries answered, qualified, chased and booked.",
    points: ["Instant enquiry response", "AI voice agent", "Outreach engine", "Database reactivation"],
  },
  {
    n: "02",
    title: "Customer support",
    body: "The same questions answered instantly, at any hour.",
    points: ["Support agent (WhatsApp, website, email)", "Status & update agent", "Human hand-over when it matters"],
  },
  {
    n: "03",
    title: "Admin & data entry",
    body: "Information moved between your tools without a person.",
    points: ["Data movement", "Document generation", "CRM & sheet updates"],
  },
  {
    n: "04",
    title: "Invoicing & reports",
    body: "Invoices, payment reminders and daily numbers, handled.",
    points: ["Invoice generation", "Payment follow-up", "Reconciliation", "Automatic reporting"],
  },
  {
    n: "05",
    title: "Operations & coordination",
    body: "Scheduling, documents, status updates, handovers.",
    points: ["Scheduling & booking", "Proposal engine", "Internal knowledge assistant", "Monitoring agents"],
  },
  {
    n: "06",
    title: "Anything repeated",
    body: "If your team does it the same way each time, it can be built.",
    points: ["Tell us the task", "We map it", "We tell you honestly if it's worth automating"],
  },
] as const;

/** "Systems we've built" filterable grid. `id` doubles as the icon-map key. */
export const SYSTEMS = [
  {
    id: "enquiry-response",
    title: "Instant enquiry response",
    category: "Sales & Growth",
    body: "Every enquiry gets an instant, personal reply — day or night.",
  },
  {
    id: "voice-agent",
    title: "AI voice agent",
    category: "Sales & Growth",
    body: "Calls your prospects and customers, in your own voice and script.",
  },
  {
    id: "outreach-engine",
    title: "Outreach engine",
    category: "Sales & Growth",
    body: "Finds and reaches the people who fit your business, on repeat.",
  },
  {
    id: "database-reactivation",
    title: "Database reactivation",
    category: "Sales & Growth",
    body: "Old leads and past customers, followed up automatically.",
  },
  {
    id: "proposal-engine",
    title: "Proposal engine",
    category: "Sales & Growth",
    body: "An enquiry comes in, a tailored proposal goes out in minutes, and it's followed up until answered.",
  },
  {
    id: "support-agent",
    title: "Support agent",
    category: "Customer Service",
    body: "The same questions answered instantly, on WhatsApp, website or email.",
  },
  {
    id: "status-agent",
    title: "Status & update agent",
    category: "Customer Service",
    body: "Customers get status updates without anyone typing them out.",
  },
  {
    id: "document-generation",
    title: "Document generation",
    category: "Operations & Admin",
    body: "Contracts, forms and paperwork, generated straight from your data.",
  },
  {
    id: "data-movement",
    title: "Data movement",
    category: "Operations & Admin",
    body: "Information moved between the tools you already use, automatically.",
  },
  {
    id: "payment-follow-up",
    title: "Payment follow-up",
    category: "Finance",
    body: "Unpaid invoices get chased, politely and on schedule, until they're settled.",
  },
  {
    id: "reconciliation",
    title: "Reconciliation",
    category: "Finance",
    body: "Records matched and checked across systems, without manual cross-referencing.",
  },
  {
    id: "automatic-reporting",
    title: "Automatic reporting",
    category: "Finance",
    body: "Daily numbers, compiled and delivered without a spreadsheet.",
  },
  {
    id: "knowledge-assistant",
    title: "Internal knowledge assistant",
    category: "Management",
    body: "Answers pulled from your own documents and process, instantly.",
  },
  {
    id: "monitoring-agents",
    title: "Monitoring agents",
    category: "Management",
    body: "Watches your systems day and night and flags what needs a human.",
  },
] as const;

/** The honest-scoping test: what gets automated vs. what stays human. */
export const TEST = {
  automate: {
    label: "Automate it",
    points: [
      "Done the same way every time",
      "Follows rules a person could write down",
      "Happens often enough to matter",
    ],
  },
  human: {
    label: "Keep it human",
    points: ["Needs judgement", "Built on relationships", "Involves negotiation"],
  },
  footer: "We'll tell you which is which — before anything gets built.",
} as const;

/** "What it gives you" — 8-card outcomes grid. */
export const OUTCOMES = [
  {
    id: "always-on",
    title: "Runs every hour of every day",
    body: "No shifts, no leave, no days off — the system works around the clock.",
  },
  {
    id: "frees-team",
    title: "Frees your team for real work",
    body: "Your people move from copy-paste to the work only they can do.",
  },
  {
    id: "nothing-forgotten",
    title: "Nothing is forgotten",
    body: "Every enquiry, follow-up and invoice is tracked until it's closed.",
  },
  {
    id: "same-standard",
    title: "The same standard every time",
    body: "No good days or bad days — every interaction gets the same quality.",
  },
  {
    id: "scales-without-hiring",
    title: "Volume grows without hiring",
    body: "Handle twice the enquiries without doubling the team.",
  },
  {
    id: "everything-recorded",
    title: "Everything is recorded",
    body: "Every action is logged, so nothing depends on memory.",
  },
  {
    id: "built-around-you",
    title: "Built around your process",
    body: "Not a generic tool — a system shaped to how you actually work.",
  },
  {
    id: "stay-in-control",
    title: "You stay in control",
    body: "You approve what it says and does before any of it goes live.",
  },
] as const;

/** "How growth changes" — the horizontal flow diagram under the outcomes grid. */
export const GROWTH_FLOW = [
  { title: "Repeat work, every day", detail: "Follow-ups · replies · data entry · invoices", emphasize: false },
  { title: "One AI system handles it", detail: "Answered · qualified · logged · followed up, 24/7", emphasize: false },
  { title: "Volume doubles", detail: "Your team size stays the same", emphasize: false },
  { title: "Extra hires needed", detail: "ZERO", emphasize: true },
] as const;

/** "How we work" — four steps from first call to live system. */
export const PROCESS = [
  {
    n: "1",
    title: "Consultation call",
    body: "We map how your business runs and where your team's time goes.",
  },
  {
    n: "2",
    title: "We define the scope",
    body: "Exactly what gets automated and what stays with your team.",
  },
  {
    n: "3",
    title: "You approve the plan",
    body: "Nothing gets built until you sign it off in writing.",
  },
  {
    n: "4",
    title: "We build & deploy",
    body: "Tested with you on real cases, live inside your business, handed over with training.",
  },
] as const;

/** What the consultation call itself leaves you with. */
export const CONSULT_POINTS = [
  "Where your team's time goes today",
  "What to automate first",
  "The impact on your profit and workload",
  "A clear scope, with no obligation",
] as const;

/** What we need from you, to get started. */
export const NEEDS = [
  "An honest picture of how the work is done today",
  "Access to the tools you already use",
  "Your existing data, in any exportable format",
  "One person who can approve scope and messaging",
  "Timely feedback during testing",
] as const;

/** What we will — and won't — promise. */
export const PROMISE = {
  heading: "What we will — and won't — promise",
  body: "Speed, coverage and consistency are ours to deliver, and we stand behind them. Sales results are not — those depend on your offer and your market. We won't promise a number we can't stand behind, and if automation isn't worth it for your business, we'll tell you instead of selling you something.",
} as const;

/** The data-handling strip under Needs & Promises. */
export const DATA_PROMISE =
  "Your data stays yours. Used only to run the system we build for you, handled in line with India's Digital Personal Data Protection Act, 2023, and returned or deleted on written request. Systems run on your own numbers, domains and accounts — under your brand." as const;

export const FAQS = [
  {
    q: "How is Routcore different from Flowfiy the product?",
    a: "Flowfiy is our self-serve AI sales platform — you sign up and run it yourself. Routcore is the opposite end of the same engineering: our team designs, builds and deploys a custom AI system directly into your business, shaped around how you actually work.",
  },
  {
    q: "What kind of work can you automate?",
    a: "Anything your team does the same way every time, that follows rules a person could write down, and happens often enough to matter — enquiry replies, follow-ups, data entry, invoicing, reporting and more. If it needs judgement, relationships or negotiation, we'll say so and leave it with your team.",
  },
  {
    q: "Do we have to change the tools we already use?",
    a: "No. Systems are built around the tools you already run your business on — we move data between them and plug into what's there, rather than asking you to switch.",
  },
  {
    q: "Will customers know they're talking to AI? Will it sound robotic?",
    a: "It speaks in your tone, follows your rules, and hands over to a person the moment a conversation needs one. You approve exactly what it says before any of it goes live.",
  },
  {
    q: "How long does it take to go live?",
    a: "It depends on scope. The written plan from your consultation call gives you a timeline before any work starts — simple systems can be live in days, larger ones take a few weeks.",
  },
  {
    q: "What happens on the consultation call?",
    a: "We map how your business runs today, where your team's time actually goes, and what's worth automating first. You keep the written plan either way, whether or not you build with us.",
  },
  {
    q: "Do you guarantee sales results?",
    a: "No — and be sceptical of anyone who does. Speed, coverage and consistency are ours to deliver, and we stand behind them. Sales results depend on your offer and your market, not on the system alone.",
  },
  {
    q: "Who owns the system and the data?",
    a: "You do. It runs on your own accounts, numbers and domains, your data is handled in line with India's Digital Personal Data Protection Act, 2023, and it's returned or deleted on written request.",
  },
  {
    q: "Which businesses is this for?",
    a: "Real estate, D2C and service businesses in particular — really, any business with work that repeats often enough for a system to be worth building.",
  },
] as const;

/** Contact-form "focus area" select. Still sent to the API as `packageTier`. */
export const FOCUS_OPTIONS = [
  "Sales & lead follow-up",
  "Customer support",
  "Admin & data entry",
  "Invoicing & reports",
  "Operations & coordination",
  "Not sure yet — help me find out",
] as const;

/** Slow hero-bottom marquee of automatable tasks. */
export const MARQUEE_TASKS = [
  "Enquiry replies",
  "Lead follow-up",
  "Invoices",
  "Daily reports",
  "Data entry",
  "Appointment booking",
  "Customer support",
  "Status updates",
  "Payment reminders",
  "Documents",
] as const;
