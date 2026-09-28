/**
 * Every fact and line of copy on the Routcore page, in one place.
 * Source: the Routcore "Custom AI Systems & Workflows" capabilities overview.
 *
 * Positioning: Routcore automates any repetitive business work, across admin,
 * finance, operations, HR, support, reporting and sales. Sales is one area
 * among seven, not the headline. Keep it that way when adding copy.
 *
 * Rules for this file:
 * - No price, rate or charge language of any kind. Specifics are discussed on
 *   the consultation call, never stated on the page.
 * - No em dashes in visible copy. Short sentences, plain words.
 * - No invented numbers, clients or testimonials. The example-day panel is a
 *   labelled illustration of what a system does, not a claim about results,
 *   and the systems list is "what we build", not a client list.
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
  body: "Routcore designs and builds one AI system around how your business runs. It processes documents, updates your records, chases payments, answers routine questions and sends your reports, day and night, without adding headcount.",
  primaryCta: { label: "Book a consultation call", href: "#contact" },
  secondaryCta: { label: "See what we automate", href: "#services" },
  stats: [
    { value: "24/7", label: "Always running, with no leave or attrition" },
    { value: "100%", label: "Custom built around your process" },
    { value: "Zero", label: "Extra hires as your volume grows" },
  ],
} as const;

/** Icon keys used by the example-day panel. Map them to lucide icons in the component. */
export type DayIcon = "report" | "documents" | "onboarding" | "reminder";

export const EXAMPLE_DAY = {
  title: "Today",
  caption: "An example day on a Routcore system",
  status: "Running",
  events: [
    {
      time: "7:00 AM",
      icon: "report",
      title: "Daily numbers sent",
      detail: "Yesterday's sales, orders and stock, emailed to the owner",
      channel: "Email",
    },
    {
      time: "9:10 AM",
      icon: "documents",
      title: "42 supplier bills processed",
      detail: "Read, checked and entered into your accounts, 2 flagged for review",
      channel: "Accounts",
    },
    {
      time: "10:30 AM",
      icon: "onboarding",
      title: "New joiner onboarded",
      detail: "Documents collected and the first-week plan sent to Priya",
      channel: "HR",
    },
    {
      time: "12:05 PM",
      icon: "reminder",
      title: "Payment reminders sent",
      detail: "Nine overdue invoices, second reminder, polite and on schedule",
      channel: "WhatsApp",
    },
  ],
  footer: ["Every action logged"],
  /** An approval request: the system asks the owner, then acts on the answer. */
  chat: {
    name: "Anita",
    initial: "A",
    context: "Owner · approval request",
    time: "3:40 PM",
    messages: [
      {
        from: "us",
        text: "Stock of 500 ml bottles will last about 3 more days. Shall I place the usual order with your regular supplier?",
      },
      { from: "them", text: "Yes, go ahead." },
      {
        from: "us",
        text: "Done. The order is placed and the supplier has confirmed delivery for Thursday. I've updated the stock sheet.",
      },
    ],
    outcome: "Approved and ordered in 4 minutes",
  },
} as const;

// ── Trust strip ────────────────────────────────────────────────

export const TRUST = {
  functionsLabel: "Automating work across",
  functions: ["Admin", "Finance", "Operations", "HR", "Support", "Sales"],
  toolsLabel: "Works with",
  tools: ["Email", "WhatsApp", "Google Sheets", "Excel", "Accounting software", "Your CRM"],
} as const;

// ── Problem ────────────────────────────────────────────────────

export const PROBLEM = {
  eyebrow: "The problem",
  title: "Most businesses don't have a people problem. They have a repeat-work problem.",
  body: "The same tasks take up the same hours, week after week. This is where it usually shows.",
  rows: [
    {
      title: "Copy-paste admin",
      body: "Details typed from emails, PDFs and forms into sheets and software, by hand.",
    },
    {
      title: "Reports built by hand",
      body: "Someone loses hours every week pulling the same numbers together.",
    },
    {
      title: "Payments chased manually",
      body: "Money already earned stays unpaid because reminders slip.",
    },
    {
      title: "Customers kept waiting",
      body: "Routine questions wait for someone to be free, and customers go elsewhere.",
    },
    {
      title: "Growth means hiring",
      body: "Every jump in volume needs another person.",
    },
    {
      title: "Knowledge in one person's head",
      body: "Work stops when they're away, or when they leave.",
    },
  ],
} as const;

// ── Services (the areas we automate) ───────────────────────────

export const FLOW_LABELS = { when: "When", does: "Routcore", result: "Result" } as const;

export const SERVICES = {
  eyebrow: "What we automate",
  title: "One system, working across every part of your business.",
  body: "Admin, finance, operations, HR, support, reporting and sales. We build around whichever apply to you, and leave the rest alone.",
  cta: "Discuss this area",
  areas: [
    {
      id: "admin",
      n: "01",
      title: "Admin & documents",
      summary: "Emails, forms, PDFs and bills read, checked and entered where they belong.",
      flow: {
        when: "A bill, form or document arrives by email or WhatsApp",
        does: "Reads it, pulls out the details and checks them",
        result: "Entered into your software and filed, with anything odd flagged",
      },
      examples: [
        "Bill and invoice processing",
        "Data pulled from forms and PDFs",
        "Information moved between your tools",
        "Documents generated from one record",
      ],
    },
    {
      id: "finance",
      n: "02",
      title: "Finance & accounts",
      summary: "Invoicing, payment reminders and reconciliation, handled on schedule.",
      flow: {
        when: "An invoice falls due",
        does: "Sends polite reminders on a schedule",
        result: "Payments matched, settled invoices marked, and you get the summary",
      },
      examples: [
        "Invoices generated and sent",
        "Payment follow-up until settled",
        "Bank and payout reconciliation",
        "Receipts and expenses captured",
      ],
    },
    {
      id: "operations",
      n: "03",
      title: "Operations",
      summary: "Orders, bookings, stock and suppliers kept moving without chasing.",
      flow: {
        when: "An order or booking comes in",
        does: "Checks it, confirms it and assigns the work",
        result: "Customer and team both updated, nothing missed",
      },
      examples: [
        "Order entry and confirmations",
        "Scheduling and bookings",
        "Stock alerts and supplier follow-up",
        "Approvals routed, with reminders",
      ],
    },
    {
      id: "support",
      n: "04",
      title: "Customer support",
      summary: "Routine questions answered instantly, at any hour.",
      flow: {
        when: "A customer asks where their order is at 11 at night",
        does: "Answers from your own records and policies",
        result: "Resolved, or handed to your team with the context",
      },
      examples: [
        "Support agent on WhatsApp, website and email",
        "Order and booking status updates",
        "Feedback collected after every order",
        "Hand-over to a person when it matters",
      ],
    },
    {
      id: "hr",
      n: "05",
      title: "HR & people",
      summary: "Onboarding, leave and routine staff questions, handled the same way every time.",
      flow: {
        when: "A new person joins the team",
        does: "Collects documents, runs the checklist and sends the first-week plan",
        result: "Every joiner onboarded the same way, nothing forgotten",
      },
      examples: [
        "Employee onboarding",
        "Leave requests and attendance records",
        "Interview scheduling and candidate updates",
        "Answers to staff questions from your policies",
      ],
    },
    {
      id: "reporting",
      n: "06",
      title: "Reporting & management",
      summary: "Your numbers built and sent to you, without anyone preparing them.",
      flow: {
        when: "It's 7 AM, or the month closes",
        does: "Pulls the numbers from your tools and builds the report",
        result: "The report lands in your inbox or on WhatsApp",
      },
      examples: [
        "Daily and monthly reports",
        "Dashboards that update themselves",
        "Alerts when a number moves",
        "Checks on the things that matter to you",
      ],
    },
    {
      id: "sales",
      n: "07",
      title: "Sales & follow-up",
      summary: "Enquiries answered, followed up and logged, so none slip through.",
      flow: {
        when: "An enquiry arrives on WhatsApp, your website or a call",
        does: "Replies within a minute and asks the right questions",
        result: "Handed to your team with the full conversation",
      },
      examples: [
        "Instant reply to every enquiry",
        "Follow-ups on schedule until there's an answer",
        "AI voice agent for calls and reminders",
        "CRM kept up to date automatically",
      ],
    },
    {
      id: "custom",
      n: "08",
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
  title: "Examples of what we build.",
  body: "A sample from across the business. Yours is scoped to your own process and tools.",
} as const;

export const SYSTEM_CATEGORIES = [
  "Admin & documents",
  "Finance & accounts",
  "Operations",
  "Customer service",
  "HR & people",
  "Reporting & management",
  "Sales & follow-up",
] as const;

export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number];

/**
 * Three per category, so each category is one row of cards on wide screens.
 * `title` and `body` are also read by the Service JSON-LD in app/routcore/page.tsx.
 */
export const SYSTEMS: ReadonlyArray<{
  title: string;
  category: SystemCategory;
  body: string;
}> = [
  {
    title: "Document processing",
    category: "Admin & documents",
    body: "Bills, invoices, forms and PDFs read automatically, with the details pulled out, checked and entered where they belong.",
  },
  {
    title: "Document generation",
    category: "Admin & documents",
    body: "Agreements, letters and paperwork produced from one record, with the same details on every document.",
  },
  {
    title: "Data movement",
    category: "Admin & documents",
    body: "Information carried between your email, sheets and software without anyone retyping it.",
  },
  {
    title: "Invoicing",
    category: "Finance & accounts",
    body: "Invoices created from your orders or records and sent on schedule, in the same format every time.",
  },
  {
    title: "Payment follow-up",
    category: "Finance & accounts",
    body: "Unpaid invoices chased politely, on a schedule, until they're settled.",
  },
  {
    title: "Reconciliation",
    category: "Finance & accounts",
    body: "Bank statements and payouts checked against your own records, with the differences flagged.",
  },
  {
    title: "Order processing",
    category: "Operations",
    body: "Orders from email, WhatsApp or your website entered, confirmed and passed to the right team.",
  },
  {
    title: "Scheduling and bookings",
    category: "Operations",
    body: "Appointments, visits and shifts booked, confirmed and reminded, without the back-and-forth.",
  },
  {
    title: "Stock and supplier follow-up",
    category: "Operations",
    body: "Stock levels watched, reorders raised for your approval, and suppliers followed up until delivery is confirmed.",
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
    title: "Feedback collection",
    category: "Customer service",
    body: "Feedback requested after every order or visit, with unhappy customers flagged to you straight away.",
  },
  {
    title: "Employee onboarding",
    category: "HR & people",
    body: "Documents, checklists and first-week plans handled the same way for every new joiner.",
  },
  {
    title: "Leave and attendance",
    category: "HR & people",
    body: "Leave requests routed for approval and attendance records kept up to date, without chasing.",
  },
  {
    title: "Internal knowledge assistant",
    category: "HR & people",
    body: "Your team gets answers from your own documents and procedures instead of asking the owner.",
  },
  {
    title: "Automatic reporting",
    category: "Reporting & management",
    body: "Your daily and monthly numbers built and sent to you, without anyone preparing them.",
  },
  {
    title: "Approvals and reminders",
    category: "Reporting & management",
    body: "Requests routed to the right person for sign-off, with reminders until they're done.",
  },
  {
    title: "Monitoring agents",
    category: "Reporting & management",
    body: "Watch for the changes that matter to your business and alert you when something moves.",
  },
  {
    title: "Enquiry response",
    category: "Sales & follow-up",
    body: "Every enquiry answered within a minute on WhatsApp, phone or email, then handed to your team with the details.",
  },
  {
    title: "AI voice agent",
    category: "Sales & follow-up",
    body: "Makes and takes routine calls for confirmations, reminders and follow-ups, and logs every call.",
  },
  {
    title: "CRM updates",
    category: "Sales & follow-up",
    body: "Calls, emails and chats logged to the right record in your CRM, so nobody updates it by hand.",
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
      topic: "Data entry",
      before: "Typed in by hand from emails and PDFs",
      after: "Read, checked and entered automatically",
    },
    {
      topic: "Reports",
      before: "Built by someone, every week",
      after: "Built and sent to you on schedule",
    },
    {
      topic: "Payments due",
      before: "Chased when someone remembers",
      after: "Reminded on schedule until settled",
    },
    {
      topic: "Customer questions",
      before: "Answered when someone is free",
      after: "Answered within a minute, at any hour",
    },
    {
      topic: "A busy month",
      before: "Hire, or let things slip",
      after: "The same team handles the extra volume",
    },
    {
      topic: "Nights and holidays",
      before: "Work waits until morning",
      after: "The system keeps running",
    },
    {
      topic: "Oversight",
      before: "You hear about problems late",
      after: "Every action logged, and you can step in at any time",
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
      "One person who can approve the scope and each sign-off",
      "Timely feedback while we test",
    ],
  },
  promise: {
    title: "What we promise",
    paragraphs: [
      "Speed, coverage and consistency are ours to deliver, and we stand behind them.",
      "Business outcomes like sales depend on your offer and your market, so we won't promise a number we can't stand behind. If automation isn't worth it for your business, we'll tell you instead of selling it to you.",
    ],
  },
  data: {
    title: "Your data stays yours.",
    body: "It's used only to run the system we build for you, handled in line with India's Digital Personal Data Protection Act, 2023, and returned or deleted on written request. Systems run on your own accounts and tools, under your brand.",
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
    a: "Flowfiy is our self-serve AI sales platform: you sign up and run it yourself. Routcore is our done-for-you practice. We design, build and deploy a custom AI system inside your business, around your own process and tools, for any repetitive work, not just sales.",
  },
  {
    q: "What kind of work can you automate?",
    a: "Anything your team does the same way every time, that follows rules a person could write down, and that happens often enough to matter. Common examples: processing bills and documents, data entry, invoicing and payment reminders, reconciliation, reports, order updates, onboarding, leave requests, support questions and enquiry follow-ups. Work that needs judgement, relationships or negotiation stays with your team.",
  },
  {
    q: "Do we have to change the tools we already use?",
    a: "No. We build around the tools you already use, such as email, WhatsApp, Google Sheets, Excel, your accounting software or your CRM, and move information between them so nobody has to retype it.",
  },
  {
    q: "Does it talk to our customers or staff on its own?",
    a: "Only where you want it to. Customer-facing messages use your tone, your rules and wording you've approved, and hand over to a person whenever they should. A lot of what we build runs quietly in the background, like processing documents, updating records and building reports. You can see every action it takes and step in at any time.",
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
    q: "Do you guarantee results?",
    a: "We guarantee what's ours to deliver: speed, coverage and consistency. Business outcomes like sales depend on your offer and your market, so we won't promise a number we can't stand behind.",
  },
  {
    q: "Who owns the system and the data?",
    a: "You do. Systems run on your own accounts and tools, under your brand. Your data is used only to run your system, handled in line with the Digital Personal Data Protection Act, 2023, and returned or deleted on written request.",
  },
  {
    q: "Which businesses is this for?",
    a: "Any business where people repeat the same work every day: manufacturers and distributors, retailers and D2C brands, clinics, agencies, real estate, and professional and service firms. So far our work spans real estate, D2C brands and service businesses.",
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
  "Admin & documents",
  "Finance & accounts",
  "Operations",
  "Customer support",
  "HR & people",
  "Reporting",
  "Sales & follow-up",
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
