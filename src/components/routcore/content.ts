/**
 * Single source of truth for every fact rendered on the Routcore page.
 *
 * Pricing here supersedes the ₹30,000 / ₹0-running-cost figures in the original
 * service-overview doc: Routcore is now sold as a build fee plus a monthly
 * retainer, so "zero running cost" is scoped to software fees only.
 */

export const CONTACT = {
  email: "info@flowfiy.com",
  phone: "+91 93946 59992",
  phoneHref: "+919394659992",
  phoneDisplay: "9394659992",
} as const;

export const CHALLENGES = [
  {
    n: "01",
    title: "Costs rise as you grow",
    body: "Sending tools charge per inbox or per lead. Every bit of success gets taxed, so scaling volume scales your bill just as fast.",
  },
  {
    n: "02",
    title: "Inbox management is a chore",
    body: "Warming, rotating and protecting the deliverability of many inboxes quietly eats hours every single week.",
  },
  {
    n: "03",
    title: "Replies get lost",
    body: "Responses scatter across dozens of inboxes. Hot leads sit unread for days and slip through the cracks.",
  },
  {
    n: "04",
    title: "The stack is fragmented",
    body: "Prospecting in one tool, sending in another, reporting in a spreadsheet. Nothing talks to anything else.",
  },
  {
    n: "05",
    title: "It doesn't scale without headcount",
    body: "More volume means more manual hours. The only lever you have left is hiring another SDR.",
  },
] as const;

/** The five stages the core assembles through as you scroll. */
export const STAGES = [
  {
    n: "01",
    kicker: "Targeting",
    title: "We define your ideal customer",
    body: "A working session locks your ICP — industry, role, company size, geography — plus your offer and the messaging angle that earns replies. Everything downstream inherits this definition.",
    points: ["ICP & offer workshop", "Messaging angle locked", "Targeting rules encoded"],
  },
  {
    n: "02",
    kicker: "Sourcing",
    title: "It finds matching prospects online",
    body: "The engine sources prospects that fit your ICP across the internet, continuously. No manual list-building, no exports, no stale CSVs sitting in a folder.",
    points: ["Continuous sourcing", "No manual list-building", "Fits your ICP by rule"],
  },
  {
    n: "03",
    kicker: "Personalization",
    title: "AI writes a message for each prospect",
    body: "Every email is generated for that specific recipient — not a template with a merge tag. Core sequences and follow-ups are built alongside it, in your voice.",
    points: ["Per-prospect generation", "Sequences & follow-ups", "Written in your voice"],
  },
  {
    n: "04",
    kicker: "Delivery",
    title: "It sends from your own inboxes",
    body: "Outreach goes out through your real email accounts, across up to 100 inboxes. You set a send cap per inbox; when one hits its limit the system rotates to the next, protecting the whole fleet's deliverability.",
    points: ["Up to 100 inboxes", "Per-inbox send caps", "Automatic rotation"],
  },
  {
    n: "05",
    kicker: "Visibility",
    title: "Everything lands on one dashboard",
    body: "Every email sent and every reply received, across every inbox, in a single unified view. Nothing to reconcile, nothing missed, no lead left sitting in an inbox nobody checks.",
    points: ["Unified send log", "All replies in one place", "Live pipeline view"],
  },
] as const;

export const DELIVERABLES = [
  {
    title: "ICP definition & strategy",
    body: "A working session to lock your target profile, offer and messaging angle.",
  },
  {
    title: "Prospecting engine setup",
    body: "Configured to source prospects matching your ICP automatically.",
  },
  {
    title: "AI email personalization",
    body: "Per-prospect message generation, plus your core sequences and follow-ups.",
  },
  {
    title: "Up to 100 inbox connections",
    body: "With per-inbox send caps and automatic rotation to protect deliverability.",
  },
  {
    title: "Unified dashboard",
    body: "All sends and all replies across every inbox, in one place.",
  },
  {
    title: "Tool integrations",
    body: "Apollo.io, Clay and other prospecting tools connected into the pipeline.",
  },
  {
    title: "24/7 autonomous operation",
    body: "The system runs continuously once live, with no per-send or per-lead software fees.",
  },
  {
    title: "Deployment to your system",
    body: "Deployed into your own environment, fully yours to run.",
  },
  {
    title: "Training & handover",
    body: "A walkthrough plus documentation so your team can operate it confidently.",
  },
] as const;

export const PHASES = [
  {
    n: "1",
    title: "Understanding your ICP",
    body: "We define your ideal customer, offer and targeting.",
  },
  {
    n: "2",
    title: "Developing the system",
    body: "We build and configure your outreach engine.",
  },
  {
    n: "3",
    title: "Testing",
    body: "We run test sends and validate deliverability and the dashboard.",
  },
  {
    n: "4",
    title: "Deploying to your system",
    body: "We deploy the engine into your environment and hand it over.",
  },
] as const;

export const PLANS = [
  {
    region: "India",
    flag: "🇮🇳",
    setup: "₹45,000 – ₹80,000",
    setupNote: "one-time build, scoped to your requirements",
    retainer: "₹20,000",
    retainerNote: "per month, ongoing operation & optimization",
    highlight: false,
  },
  {
    region: "International",
    flag: "🌍",
    setup: "$2,500",
    setupNote: "one-time build",
    retainer: "$300",
    retainerNote: "per month, ongoing operation & optimization",
    highlight: true,
  },
] as const;

export const PLAN_INCLUDES = [
  "Everything in What's Included",
  "50% advance, 50% on delivery",
  "Live in about 2 days",
  "No per-send or per-lead software fees",
  "Deployed into your own environment",
  "Direct access to the founders",
] as const;

export const PROVIDE = [
  {
    title: "Domains & inboxes",
    body: "Google Workspace or equivalent. We'll recommend how many you need and exactly how to set them up.",
  },
  {
    title: "Your offer & brand details",
    body: "So the messaging is accurate, on-brand and something you'd be happy to sign your name to.",
  },
  {
    title: "Access to existing tools",
    body: "Any prospecting tools you already pay for — Apollo, Clay or others — that you'd like wired into the pipeline.",
  },
  {
    title: "Timely approvals",
    body: "Quick sign-off on the ICP and email copy so the two-day timeline actually holds.",
  },
] as const;

export const EXPECT = [
  "A fully automated outbound engine running 24/7, with no manual list-building or sending.",
  "Consistent, personalized outreach at scale across up to 100 inboxes, deliverability protected by rotation.",
  "Every reply in one place, so your team can act on interested prospects immediately.",
  "A connected pipeline that works with the prospecting tools you already use.",
] as const;

export const FAQS = [
  {
    q: "How is this different from Flowfiy the product?",
    a: "Flowfiy is our self-serve AI sales platform — you sign up and run it yourself. Routcore is the done-for-you version: we design, build and deploy a lead generation and outreach system into your own environment, tuned to your ICP and your offer. Same engineering, delivered as a service.",
  },
  {
    q: "What does the monthly retainer actually cover?",
    a: "Ongoing operation and optimization of your engine — monitoring deliverability, tuning the ICP and messaging as results come in, adjusting sequences, and support when something needs changing. The build fee gets the system live; the retainer keeps it performing.",
  },
  {
    q: "Why is the Indian price a range?",
    a: "₹45,000 to ₹80,000 depends on scope — how many inboxes, how many sequences, which tools need integrating, and how much custom logic your targeting needs. We quote a fixed number after the discovery call, before any work starts.",
  },
  {
    q: "What does \"no running cost\" mean exactly?",
    a: "The system itself charges nothing per send or per lead — there's no software metering on top of your retainer. You do pay your own providers directly: domains and inboxes (e.g. Google Workspace), and any third-party prospecting tools you choose to connect, like Apollo or Clay.",
  },
  {
    q: "Can it really be live in two days?",
    a: "Yes, provided your domains and inboxes are ready and you turn around approvals on the ICP and copy quickly. The four phases — ICP, build, testing, deployment — are designed to run inside that window. Deliverability warming on brand-new domains takes longer and runs in parallel.",
  },
  {
    q: "Do you guarantee a number of meetings?",
    a: "No, and be sceptical of anyone who does. Outreach performance depends on your offer, list quality, domain reputation and email infrastructure. We optimize continuously to improve results over time, but specific reply or meeting volumes are not guaranteed.",
  },
  {
    q: "Who owns the system once it's built?",
    a: "You do. It's deployed into your own environment with training and documentation, so your team can operate it independently. The retainer is for us to keep improving it, not for you to keep access.",
  },
] as const;
