/**
 * Single source of truth for every fact rendered on the Routcore page.
 *
 * Three channel tiers. No prices anywhere on the page by design — pricing is
 * quoted on the discovery call once scope is known, and the offering is the
 * same worldwide, so there is no domestic vs. international split either.
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
    title: "It reaches out on your channels",
    body: "Email goes out through your real accounts, across up to 100 inboxes — you set a cap per inbox and the system rotates when one hits its limit, protecting the whole fleet's deliverability. Add an AI voice agent, LinkedIn and WhatsApp and the same engine works those channels in step with the email.",
    points: ["Up to 100 inboxes", "Automatic rotation", "Voice · LinkedIn · WhatsApp"],
  },
  {
    n: "05",
    kicker: "Visibility",
    title: "Everything lands on one dashboard",
    body: "Every message sent and every reply received — across every inbox and every channel — in a single unified view. Nothing to reconcile, nothing missed, no lead left sitting somewhere nobody checks.",
    points: ["Unified send log", "All replies in one place", "Live pipeline view"],
  },
] as const;

/** `tier` marks a deliverable that only ships with a higher channel tier. */
export const DELIVERABLES = [
  {
    title: "ICP definition & strategy",
    body: "A working session to lock your target profile, offer and messaging angle.",
    tier: null,
  },
  {
    title: "Prospecting engine setup",
    body: "Configured to source prospects matching your ICP automatically.",
    tier: null,
  },
  {
    title: "AI message personalization",
    body: "Per-prospect message generation, plus your core sequences and follow-ups.",
    tier: null,
  },
  {
    title: "Up to 100 inbox connections",
    body: "With per-inbox send caps and automatic rotation to protect deliverability.",
    tier: null,
  },
  {
    title: "Unified dashboard",
    body: "All sends and all replies, across every inbox and channel, in one place.",
    tier: null,
  },
  {
    title: "Tool integrations",
    body: "Apollo.io, Clay and other prospecting tools connected into the pipeline.",
    tier: null,
  },
  {
    title: "AI voice calling agent",
    body: "Calls your prospects with a script built around your offer, and logs every outcome.",
    tier: "Tier 2 and above",
  },
  {
    title: "LinkedIn & WhatsApp outreach",
    body: "The same engine works both channels in step with the email sequence.",
    tier: "Tier 3",
  },
  {
    title: "24/7 autonomous operation",
    body: "The system runs continuously once live, with no per-send or per-lead software fees.",
    tier: null,
  },
  {
    title: "Deployment to your system",
    body: "Deployed into your own environment, fully yours to run.",
    tier: null,
  },
  {
    title: "Training & handover",
    body: "A walkthrough plus documentation so your team can operate it confidently.",
    tier: null,
  },
  {
    title: "Ongoing optimization",
    body: "Covered by the retainer: deliverability monitoring, ICP and copy tuning as results land.",
    tier: null,
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

/**
 * The three tiers, separated by how many channels the engine works.
 *
 * No figures live here by design: pricing is quoted on the discovery call once
 * scope is known, and it is the same offering worldwide — there is no domestic
 * vs. international split on the site.
 */
export const TIERS = [
  {
    id: "tier-1",
    name: "Tier 1",
    channelLabel: "Email",
    tagline: "The core outbound engine, end to end.",
    channels: ["Email"],
    hasVoice: false,
    highlight: false,
    features: [
      "ICP definition & strategy session",
      "Prospecting engine, sourcing continuously",
      "AI-personalized email per prospect",
      "Up to 100 inboxes with automatic rotation",
      "Unified sends-and-replies dashboard",
      "Apollo, Clay & tool integrations",
    ],
  },
  {
    id: "tier-2",
    name: "Tier 2",
    channelLabel: "Email + Voice",
    tagline: "Add an AI voice agent that actually calls them.",
    channels: ["Email", "Voice"],
    hasVoice: true,
    highlight: true,
    features: [
      "Everything in Tier 1",
      "AI voice calling agent",
      "Call scripts built around your offer",
      "Calls triggered off email engagement",
      "Call outcomes on the same dashboard",
    ],
  },
  {
    id: "tier-3",
    name: "Tier 3",
    channelLabel: "Email + Voice + LinkedIn + WhatsApp",
    tagline: "Every channel your buyer actually answers on.",
    channels: ["Email", "Voice", "LinkedIn", "WhatsApp"],
    hasVoice: true,
    highlight: false,
    features: [
      "Everything in Tier 2",
      "LinkedIn outreach automation",
      "WhatsApp outreach automation",
      "Coordinated multi-channel sequencing",
      "Every channel's replies in one inbox",
    ],
  },
] as const;

export const PLAN_INCLUDES = [
  "A fixed quote before any work starts",
  "Live in about 2 days",
  "No per-send or per-lead software fees",
  "Deployed into your own environment",
  "Training, documentation & handover",
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
    q: "Which tier should I start on?",
    a: "Most teams start on Tier 1 — it's the full engine, and email is the channel with the cleanest economics at volume. Move to Tier 2 when you want to reach people who never reply to email, and Tier 3 when your buyers live on LinkedIn or WhatsApp. You can upgrade later without rebuilding what's already running.",
  },
  {
    q: "How much does it cost?",
    a: "We quote a fixed price on the discovery call, once we know your scope — how many inboxes, how many sequences, which tools need integrating, which tier fits and how much custom targeting logic you need. Pricing is the same wherever you're based, and nothing is charged until you've seen the number and agreed to it.",
  },
  {
    q: "How is voice calling billed?",
    a: "Separately from the retainer and charged on actual usage, at a per-minute rate we confirm on the discovery call. It's a pass-through telephony cost, so you only pay for minutes the agent actually spends on calls — nothing is metered when it isn't calling. This applies to Tier 2 and Tier 3, which include the voice agent.",
  },
  {
    q: "What does \"no running cost\" mean exactly?",
    a: "The system itself charges nothing per send or per lead — there's no software metering on top of your retainer. You do pay your own providers directly: domains and inboxes (e.g. Google Workspace), any third-party prospecting tools you connect like Apollo or Clay, and voice minutes if you're on a tier that includes the calling agent.",
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
