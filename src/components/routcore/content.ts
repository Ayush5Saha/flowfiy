/**
 * Every fact and line of copy on the Routcore page, in one place.
 * Source: the Routcore "Custom AI Systems & Workflows" capabilities overview.
 *
 * Rules for this file:
 * - No price, rate or charge language of any kind. Specifics are discussed on
 *   the consultation call, never stated on the page.
 * - No em dashes in visible copy. Short sentences, plain words.
 * - No invented numbers, clients or testimonials. The example-day panel is a
 *   labelled illustration of what the system does, not a claim about results.
 */

export const CONTACT = {
  email: "info@flowfiy.com",
  whatsapp: "https://wa.me/919394659992",
  founders: [
    {
      name: "Ayush Saha",
      role: "Co-founder",
      initials: "AS",
      phone: "+91 93946 59992",
      phoneHref: "+919394659992",
    },
    {
      name: "Yaswanth Alok",
      role: "Co-founder",
      initials: "YA",
      phone: "+91 97879 30278",
      phoneHref: "+919787930278",
    },
  ],
} as const;

export const NAV = [
  { label: "Services", href: "#services" },
  { label: "Systems", href: "#systems" },
  { label: "Process", href: "#process" },
  { label: "FAQ", href: "#faq" },
] as const;

// ── Hero ───────────────────────────────────────────────────────

export const HERO = {
  badge: "Custom AI systems and workflows",
  titleLead: "Automate the work your team repeats",
  titleAccent: "every day.",
  body: "Routcore designs and builds one AI system around how your business runs. It replies to enquiries, follows up, moves data between your tools and sends your reports, day and night, without adding headcount.",
  primaryCta: { label: "Book a consultation call", href: "#contact" },
  secondaryCta: { label: "See what we automate", href: "#services" },
  stats: [
    { value: "24/7", label: "Always running, with no leave or attrition" },
    { value: "< 1 min", label: "To answer every new enquiry" },
    { value: "Zero", label: "Extra hires as your volume grows" },
  ],
} as const;

/** Icon keys used by the example-day panel. Map them to lucide icons in the component. */
export type DayIcon = "report" | "reminder" | "handover" | "sync" | "enquiry";

export const EXAMPLE_DAY = {
  title: "Today",
  caption: "An example day on a Routcore system",
  status: "Running",
  events: [
    {
      time: "7:00 AM",
      icon: "report",
      title: "Daily report sent",
      detail: "Yesterday's enquiries, visits and follow-ups, emailed to the owner",
      channel: "Email",
    },
    {
      time: "9:15 AM",
      icon: "reminder",
      title: "Payment reminder sent",
      detail: "Invoice #1042, second reminder, polite and on schedule",
      channel: "WhatsApp",
    },
    {
      time: "10:30 AM",
      icon: "handover",
      title: "Lead qualified and handed over",
      detail: "Requirement, location and timeline captured for Priya",
      channel: "CRM",
    },
    {
      time: "12:05 PM",
      icon: "sync",
      title: "Records updated",
      detail: "38 form entries moved into your sheet, duplicates removed",
      channel: "Sheets",
    },
  ],
  // The 11:42 PM enquiry is shown as the chat card beside the panel, not as a row.
  footer: ["Every action logged"],
  chat: {
    name: "Rahul",
    context: "New enquiry",
    time: "11:42 PM",
    messages: [
      { from: "them", text: "Hi, is the 2BHK in Whitefield still available?" },
      {
        from: "us",
        text: "Yes, two units are left on the 7th floor. Would you like to visit this Saturday? I can book 11 AM or 4 PM.",
      },
      { from: "them", text: "11 works." },
      {
        from: "us",
        text: "Done. You're booked for Saturday at 11 AM. I'll send a reminder on Friday evening.",
      },
    ],
    replyTime: "Replied in 38 seconds",
  },
} as const;

// ── Trust strip ────────────────────────────────────────────────

export const INDUSTRIES = ["Real estate", "D2C brands", "Service businesses"] as const;

export const CHANNELS = [
  "WhatsApp",
  "Email",
  "Phone calls",
  "Website chat",
  "Google Sheets",
  "Your CRM",
] as const;

// ── Problem ────────────────────────────────────────────────────

export const PROBLEM = {
  eyebrow: "The problem",
  title: "Most businesses don't have a people problem. They have a repeat-work problem.",
  body: "The same tasks take up the same hours, week after week. This is where it usually shows.",
  rows: [
    {
      title: "The same work, every day",
      body: "Invoices, data entry, reports and replies done by hand, by people you hired for more than that.",
    },
    {
      title: "Slow replies to enquiries",
      body: "The customer goes with whoever answered first.",
    },
    {
      title: "Missed follow-ups",
      body: "Money already earned never gets collected.",
    },
    {
      title: "Growth means hiring",
      body: "Every jump in volume needs another person.",
    },
    {
      title: "Tools that don't talk",
      body: "Hours spent copying data between systems, and the mistakes that come with it.",
    },
    {
      title: "Knowledge in one person's head",
      body: "Work stops when they're away, or when they leave.",
    },
  ],
} as const;

// ── Services (the six areas) ───────────────────────────────────

export const FLOW_LABELS = { when: "When", does: "Routcore", result: "Result" } as const;

export const SERVICES = {
  eyebrow: "What we automate",
  title: "One system, working across six areas of your business.",
  body: "We build around whichever of these apply to you, and leave the rest alone.",
  cta: "Discuss this area",
  areas: [
    {
      id: "sales",
      n: "01",
      title: "Sales & lead follow-up",
      summary: "Every enquiry answered, qualified, chased and booked.",
      flow: {
        when: "A new enquiry arrives on WhatsApp, your website or a call",
        does: "Replies within a minute, asks the right questions and books a meeting",
        result: "A qualified lead in your CRM, with the full conversation",
      },
      examples: [
        "Instant reply to every enquiry",
        "AI voice agent that calls and books meetings",
        "Personal outreach on email, LinkedIn and WhatsApp",
        "Old enquiries and past customers re-engaged",
      ],
    },
    {
      id: "support",
      n: "02",
      title: "Customer support",
      summary: "Common questions answered instantly, at any hour.",
      flow: {
        when: "A customer asks a question at 11 at night",
        does: "Answers from your own policies and documents",
        result: "Resolved, or handed to your team with the context",
      },
      examples: [
        "Support agent on WhatsApp, website and email",
        "Order and booking updates before customers ask",
        "Hand-over to a person when it matters",
        "Every conversation logged",
      ],
    },
    {
      id: "admin",
      n: "03",
      title: "Admin & data entry",
      summary: "Information moved between your tools without anyone retyping it.",
      flow: {
        when: "A form is filled in or an email arrives",
        does: "Pulls out the details and checks them",
        result: "Your sheet, CRM and records updated",
      },
      examples: [
        "Data moved between your tools",
        "Documents generated from one record",
        "CRM and spreadsheet updates",
        "Duplicates and errors flagged",
      ],
    },
    {
      id: "finance",
      n: "04",
      title: "Invoicing & reports",
      summary: "Invoices, reminders and your daily numbers, handled.",
      flow: {
        when: "An invoice falls due",
        does: "Sends polite reminders on a schedule",
        result: "Settled invoices marked, and the report lands with you",
      },
      examples: [
        "Invoices generated from your records",
        "Payment follow-up until settled",
        "Statements reconciled against your books",
        "Daily and monthly reports sent to you",
      ],
    },
    {
      id: "operations",
      n: "05",
      title: "Operations & coordination",
      summary: "Scheduling, documents, status updates and handovers.",
      flow: {
        when: "A booking or request comes in",
        does: "Checks availability and confirms it",
        result: "Customer and team both notified",
      },
      examples: [
        "Scheduling and booking",
        "Tailored proposals out in minutes",
        "An internal assistant that answers from your procedures",
        "Alerts when something important changes",
      ],
    },
    {
      id: "custom",
      n: "06",
      title: "Anything repeated",
      summary: "If your team does it the same way each time, it can be built.",
      flow: {
        when: "A task your team repeats every week",
        does: "We map it step by step, with you",
        result: "It runs on its own, and every run is logged",
      },
      examples: [
        "Tell us the task",
        "We map how it's done today",
        "We tell you honestly if it's worth automating",
        "Built, tested and handed over",
      ],
    },
  ],
} as const;

// ── Example systems ────────────────────────────────────────────

export const SYSTEMS_HEADER = {
  eyebrow: "Example systems",
  title: "Systems we've built for other businesses.",
  body: "A sample of past work. Yours is scoped to your own process.",
} as const;

export const SYSTEM_CATEGORIES = [
  "Sales & growth",
  "Customer service",
  "Operations & admin",
  "Finance",
  "Management",
] as const;

export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number];

/** `title` and `body` are also read by the Service JSON-LD in app/routcore/page.tsx. */
export const SYSTEMS: ReadonlyArray<{
  title: string;
  category: SystemCategory;
  body: string;
}> = [
  {
    title: "Instant enquiry response",
    category: "Sales & growth",
    body: "Every enquiry answered within a minute on WhatsApp, phone and email, qualified in conversation, then routed to your team.",
  },
  {
    title: "AI voice agent",
    category: "Sales & growth",
    body: "Calls prospects and customers, answers their questions and books meetings into your calendar. Every call is recorded and logged.",
  },
  {
    title: "Outreach engine",
    category: "Sales & growth",
    body: "Finds the right people for what you sell and reaches them personally over email, LinkedIn and WhatsApp.",
  },
  {
    title: "Database reactivation",
    category: "Sales & growth",
    body: "Old enquiries and past customers re-engaged automatically. Usually the fastest win, because they already know you.",
  },
  {
    title: "Support agent",
    category: "Customer service",
    body: "Answers your common questions on WhatsApp, your website and email, day and night, and hands over to a person when it matters.",
  },
  {
    title: "Status and update agent",
    category: "Customer service",
    body: "Tells customers where their order, booking or request stands, before they have to ask.",
  },
  {
    title: "Proposal engine",
    category: "Operations & admin",
    body: "An enquiry comes in, a tailored proposal goes out in minutes, and it's followed up until answered.",
  },
  {
    title: "Document generation",
    category: "Operations & admin",
    body: "Invoices, agreements and paperwork produced from one record, with the same details on every document.",
  },
  {
    title: "Data movement",
    category: "Operations & admin",
    body: "Information carried between your tools without anyone retyping it.",
  },
  {
    title: "Payment follow-up",
    category: "Finance",
    body: "Unpaid invoices chased politely, on a schedule, until they're settled.",
  },
  {
    title: "Reconciliation",
    category: "Finance",
    body: "Statements and payouts checked against your own records, with the differences flagged.",
  },
  {
    title: "Automatic reporting",
    category: "Management",
    body: "Your daily and monthly numbers built and sent to you, without anyone preparing them.",
  },
  {
    title: "Internal knowledge assistant",
    category: "Management",
    body: "Your team gets answers from your own documents and procedures instead of asking the owner.",
  },
  {
    title: "Monitoring agents",
    category: "Management",
    body: "Watch for the changes that matter to your business and alert you when something moves.",
  },
];

// ── Before / after ─────────────────────────────────────────────

export const COMPARISON = {
  eyebrow: "What changes",
  title: "Twice the work doesn't have to mean twice the team.",
  body: "What a Routcore system changes in your day-to-day.",
  columns: { before: "Today", after: "With Routcore" },
  rows: [
    {
      topic: "New enquiries",
      before: "Answered when someone is free",
      after: "Answered within a minute, at any hour",
    },
    {
      topic: "Follow-ups",
      before: "Sent when someone remembers",
      after: "Sent on schedule until there's an answer",
    },
    {
      topic: "A busy month",
      before: "Hire, or let things slip",
      after: "The same team handles the extra volume",
    },
    {
      topic: "Records",
      before: "Spread across phones, inboxes and sheets",
      after: "Every conversation and action logged",
    },
    {
      topic: "Quality",
      before: "Depends on who handles it",
      after: "Same questions, same tone, same steps",
    },
    {
      topic: "Nights and holidays",
      before: "Work waits until morning",
      after: "The system keeps running",
    },
    {
      topic: "Oversight",
      before: "You hear about problems late",
      after: "Read any conversation and step in at any time",
    },
  ],
} as const;

// ── Honest scoping ─────────────────────────────────────────────

export const SCOPING = {
  eyebrow: "Honest scoping",
  title: "Not everything should be automated.",
  body: "Before anything is built, every task goes through one test. If it fails, it stays with your team, and we'll tell you so.",
  automate: {
    title: "Automate it",
    points: [
      "It's done the same way every time",
      "It follows rules a person could write down",
      "It happens often enough to matter",
    ],
  },
  keep: {
    title: "Keep it with your team",
    points: ["It needs judgement", "It depends on a relationship", "It involves negotiation"],
  },
} as const;

// ── Process ────────────────────────────────────────────────────

export const PROCESS = {
  eyebrow: "How we work",
  title: "From first call to a live system, in four steps.",
  steps: [
    {
      n: "01",
      title: "Consultation call",
      body: "We map how your business runs and where your team's time goes.",
    },
    {
      n: "02",
      title: "Scope",
      body: "We agree exactly what gets automated, and what stays with your team.",
    },
    {
      n: "03",
      title: "Your sign-off",
      body: "Nothing is built until you approve the plan in writing.",
    },
    {
      n: "04",
      title: "Build and hand-over",
      body: "Built, tested with you on real cases, deployed, and handed over with training.",
    },
  ],
} as const;

export const CONSULTATION = {
  eyebrow: "The consultation call",
  title: "You leave with a written plan, whether you build with us or not.",
  body: "We look at how the work gets done today, measure the hours it takes, and show you where automation will make the biggest difference.",
  cta: { label: "Book your consultation call", href: "#contact" },
  plan: {
    label: "Automation plan",
    preparedFor: "Prepared for your business",
    sections: [
      "Where your team's time goes",
      "What to automate first",
      "Impact on workload and profit",
      "Scope and timeline",
    ],
    footnote: "Yours to keep",
  },
} as const;

// ── Working together ───────────────────────────────────────────

export const COMMITMENTS = {
  eyebrow: "Working together",
  title: "What we need from you, and what we promise.",
  needs: {
    title: "What we need from you",
    items: [
      "An honest picture of how the work is done today",
      "Access to the tools you already use",
      "Your existing data, in any exportable format",
      "One person who can approve scope and messaging",
      "Timely feedback while we test",
    ],
  },
  promise: {
    title: "What we promise",
    paragraphs: [
      "Speed, coverage and consistency are ours to deliver, and we stand behind them.",
      "Sales results depend on your offer and your market, so we won't promise a number we can't stand behind. If automation isn't worth it for your business, we'll tell you instead of selling it to you.",
    ],
  },
  data: {
    title: "Your data stays yours.",
    body: "It's used only to run the system we build for you, handled in line with India's Digital Personal Data Protection Act, 2023, and returned or deleted on written request. Systems run on your own numbers, domains and accounts, under your brand.",
  },
  foundersTitle: "You work directly with the founders.",
} as const;

// ── FAQ ────────────────────────────────────────────────────────

export const FAQ_HEADER = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  body: "Something else on your mind? Call or WhatsApp us.",
} as const;

/** `q` and `a` are also read by the FAQPage JSON-LD in app/routcore/page.tsx. */
export const FAQS = [
  {
    q: "How is Routcore different from Flowfiy?",
    a: "Flowfiy is our self-serve AI sales platform: you sign up and run it yourself. Routcore is our done-for-you practice. We design, build and deploy a custom AI system inside your business, around your own process and tools.",
  },
  {
    q: "What kind of work can you automate?",
    a: "Anything your team does the same way every time, that follows rules a person could write down, and that happens often enough to matter. Enquiry replies, follow-ups, support questions, data entry, invoices, reminders and reports are the most common. Work that needs judgement, relationships or negotiation stays with your team.",
  },
  {
    q: "Do we have to change the tools we already use?",
    a: "No. We build around the tools you already have, such as WhatsApp, email, Google Sheets or your CRM, and move information between them so nobody has to retype it.",
  },
  {
    q: "Will customers know they're talking to an AI?",
    a: "The system uses your tone, your rules and messages you've approved. It hands the conversation to a person whenever it should, and you can read any conversation and step in at any time.",
  },
  {
    q: "How long does it take to go live?",
    a: "It depends on the scope. The written plan from your consultation sets out the timeline before any work starts. Simple systems can be live in days, and larger ones take a few weeks.",
  },
  {
    q: "What happens on the consultation call?",
    a: "We map how your business runs today, where your team's time goes and what to automate first. You leave with a complete written plan, and it's yours to keep whether you build with us or not.",
  },
  {
    q: "Do you guarantee sales results?",
    a: "No. Speed, coverage and consistency are ours to deliver, and we stand behind them. Sales results depend on your offer and your market, so we won't promise a number we can't stand behind.",
  },
  {
    q: "Who owns the system and the data?",
    a: "You do. Systems run on your own numbers, domains and accounts, under your brand. Your data is used only to run your system, handled in line with the Digital Personal Data Protection Act, 2023, and returned or deleted on written request.",
  },
  {
    q: "Which businesses is this for?",
    a: "Businesses with a steady flow of enquiries, customers or paperwork. We work across real estate, D2C brands and service businesses, and with anyone whose team repeats the same work every day.",
  },
] as const;

// ── Contact ────────────────────────────────────────────────────

export const CONTACT_SECTION = {
  eyebrow: "Get started",
  title: "Tell us what your team does over and over.",
  body: "Share a little about your business. We'll set up a consultation call, map the work with you and tell you honestly what's worth automating.",
  stepsTitle: "What happens next",
  steps: [
    "We read your note and get in touch",
    "We map your work on a consultation call",
    "You get a written plan to keep",
  ],
  formTitle: "Request a consultation call",
  formBody: "Takes about a minute. Fields marked * are required.",
  submit: "Request a consultation call",
  sending: "Sending",
  privacyNote: "We use your details only to reply to this enquiry.",
  success: {
    title: "Thanks, we've got it.",
    body: "We'll be in touch shortly to set up your consultation call.",
  },
} as const;

/** Sent to /api/routcore as `packageTier` (the API field name predates this form). */
export const FOCUS_OPTIONS = [
  "Sales & lead follow-up",
  "Customer support",
  "Admin & data entry",
  "Invoicing & reports",
  "Operations & coordination",
  "Not sure yet, help me find out",
] as const;

// ── Footer ─────────────────────────────────────────────────────

export const FOOTER = {
  blurb: "Routcore is the AI automation practice of Flowfiy.",
  links: [
    { label: "Flowfiy", href: "/" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "#contact" },
  ],
} as const;
