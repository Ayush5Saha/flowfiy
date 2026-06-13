const fs = require("fs");

const BASE_URL = process.env.FLOWFIY_ADMIN_URL || "https://flowfiy.com";

function loadEnvLocal() {
  if (!fs.existsSync(".env.local")) return;
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

function readOwnerCredentials() {
  const source = fs.readFileSync("src/lib/admin-auth.ts", "utf8");
  const fallbackEmail = source.match(/ADMIN_EMAIL \|\| "([^"]+)"/)?.[1];
  const fallbackPassword = source.match(/ADMIN_PASSWORD \|\| "([^"]+)"/)?.[1];
  return {
    email: process.env.ADMIN_EMAIL || fallbackEmail,
    password: process.env.ADMIN_PASSWORD || fallbackPassword,
  };
}

const posts = [
  {
    category: "AI Lead Generation",
    title: "The AI Lead Generation Operating System: Source, Score, Sequence, Learn",
    slug: "ai-lead-generation-operating-system-source-score-sequence-learn",
    readTime: "7 min read",
    excerpt: "AI lead generation works best as an operating system, not a list-building trick. This guide explains how source quality, scoring, sequencing, and learning loops create better pipeline.",
    seoTitle: "The AI Lead Generation Operating System for 2026",
    metaDescription: "Build an AI lead generation operating system around sourcing, fit scoring, sequencing, and learning loops that improve every campaign.",
    links: [
      ["Signal-Based Pipeline", "ai-lead-generation-2026-signal-based-pipeline"],
      ["Research Depth Beats Volume", "why-research-depth-beats-email-volume-modern-cold-outreach"],
      ["Five-Agent Workflow", "autonomous-outbound-five-agent-workflow-behind-flowfiy"],
    ],
    sections: [
      ["Lead generation is becoming a system", "The best AI lead generation teams are no longer asking a single tool to find more names. They are building a repeatable operating system that can discover accounts, understand fit, rank urgency, launch context-aware outreach, and learn from the result. That system view matters because each stage affects the next one. Weak sourcing creates weak research. Weak research creates generic copy. Generic copy creates poor engagement signals."],
      ["The four-part loop", "A strong Flowfiy-style workflow has four connected stages: source, score, sequence, and learn. Sourcing creates the candidate pool. Scoring decides who deserves outreach. Sequencing turns research into short, relevant messages. Learning feeds replies, bounces, objections, and meetings back into future targeting. When those pieces are connected, lead generation stops being a one-time export and becomes a living pipeline engine."],
      ["Why scoring belongs before sending", "Most teams score after a contact enters a CRM. That is too late. AI lead generation should score before outreach capacity is spent. A prospect should earn its place in a campaign by showing fit, contactability, and a real reason to start a conversation. Flowfiy can use website signals, review patterns, location data, service pages, and enrichment data to decide whether a lead is worth a send."],
      ["The compounding advantage", "The first campaign teaches the second campaign. The second campaign teaches the third. Over time, the system learns which categories reply, which gaps create interest, which segments create bounces, and which offers are misunderstood. That is the compounding advantage of an operating system over a static lead list."],
    ],
  },
  {
    category: "AI Lead Generation",
    title: "How to Build an ICP That an AI Agent Can Actually Use",
    slug: "how-to-build-an-icp-ai-agent-can-use",
    readTime: "6 min read",
    excerpt: "Most ICP documents are too vague for automation. Learn how to define an ICP with observable signals an AI agent can use to find, score, and prioritize real prospects.",
    seoTitle: "How to Build an ICP an AI Agent Can Use",
    metaDescription: "Turn your ICP into observable criteria an AI lead generation agent can use for sourcing, scoring, and prioritization.",
    links: [
      ["Local SMB Lead Scoring", "how-flowfiy-scores-local-smb-leads-before-outreach"],
      ["Buyer Intent Signals", "buyer-intent-signals-ai-lead-generation-flowfiy"],
      ["Founder Automation", "what-founders-should-automate-first-with-ai-in-2026"],
    ],
    sections: [
      ["Vague ICPs break automation", "A human can interpret a fuzzy ICP like 'fast-growing service businesses that need more leads.' An AI agent needs observable criteria. If the system cannot see the signal, it cannot use the signal. The best ICPs for AI lead generation translate strategy into evidence: industry, geography, website behavior, review volume, hiring activity, tech stack, content themes, and conversion gaps."],
      ["Use inclusion and exclusion rules", "A useful ICP tells the agent what to include and what to avoid. Include rules might define target business types, location count, visible demand, or service complexity. Exclusion rules might remove franchises, marketplaces, inactive websites, student projects, or companies with poor contactability. These rules keep Flowfiy from wasting research and sending capacity on leads that were never likely to convert."],
      ["Define a reason to reach out", "An ICP should not stop at firmographics. It should describe the business moment that makes outreach relevant. A clinic without online booking, a SaaS company hiring SDRs, or an agency expanding into a new city each gives the AI a specific angle. That angle becomes both a scoring signal and a personalization hook."],
      ["Keep the ICP measurable", "The practical test is simple: can the agent explain why this lead matched? If the answer is no, the ICP is still too abstract. Flowfiy should be able to return a short evidence trail for every qualified lead so founders can trust the pipeline before campaigns launch."],
    ],
  },
  {
    category: "AI Lead Generation",
    title: "Buyer Intent Signals Flowfiy Should Watch Before It Writes an Email",
    slug: "buyer-intent-signals-ai-lead-generation-flowfiy",
    readTime: "6 min read",
    excerpt: "Intent signals turn cold outreach into timely outreach. Here are the website, hiring, review, and market signals Flowfiy can use before writing a single email.",
    seoTitle: "Buyer Intent Signals for AI Lead Generation",
    metaDescription: "See the buyer intent signals Flowfiy can use to prioritize leads before AI outreach begins.",
    links: [
      ["Signal-Based Pipeline", "ai-lead-generation-2026-signal-based-pipeline"],
      ["ICP an AI Can Use", "how-to-build-an-icp-ai-agent-can-use"],
      ["Latest AI Sales Updates", "latest-ai-sales-updates-agentic-workflows-outbound"],
    ],
    sections: [
      ["Intent turns cold into timely", "Cold outreach fails when timing is random. Intent signals do not guarantee a buyer is ready, but they improve the odds that a message arrives during a relevant business moment. Flowfiy can use these signals to decide which leads deserve deeper research and which should wait."],
      ["Operational signals", "Operational signals show pressure or change. Hiring sales, operations, support, or marketing roles can imply growth. New location pages can imply expansion. Fresh service pages can imply a go-to-market push. Reviews mentioning delays, scheduling, or poor communication can reveal pain that a vendor may solve."],
      ["Digital friction signals", "Some intent appears as friction. A company may have strong demand but a weak website, no booking path, slow pages, inconsistent contact details, or unclear CTAs. For local and SMB markets, these signals can be more useful than traditional enterprise buying intent."],
      ["How Flowfiy should use the signals", "Intent signals should not automatically trigger a campaign. They should raise the lead score, shape the opener, and determine the right sequence. A signal is strongest when it connects directly to the customer's offer. The result is outreach that feels timely instead of random."],
    ],
  },
  {
    category: "AI Lead Generation",
    title: "From Google Maps to Qualified Pipeline: The SMB Lead Gen Playbook",
    slug: "google-maps-to-qualified-pipeline-smb-lead-gen-playbook",
    readTime: "7 min read",
    excerpt: "Google Maps discovery is powerful for local SMB outbound, but only when paired with qualification, enrichment, and research. Here is Flowfiy's practical playbook.",
    seoTitle: "Google Maps to Qualified Pipeline: SMB Lead Gen Playbook",
    metaDescription: "Learn how Flowfiy can turn Google Maps discovery into qualified SMB pipeline using enrichment, scoring, and personalized outreach.",
    links: [
      ["Local SMB Lead Scoring", "how-flowfiy-scores-local-smb-leads-before-outreach"],
      ["AI Lead Gen Operating System", "ai-lead-generation-operating-system-source-score-sequence-learn"],
      ["Cold Email Deliverability", "cold-email-deliverability-2026-relevance-new-warmup"],
    ],
    sections: [
      ["Maps is a wedge, not the whole system", "Google Maps is one of the richest sources for local and SMB prospecting because it exposes businesses that classic B2B databases often miss. But maps data by itself is not pipeline. A list of clinics, agencies, restaurants, gyms, or service providers becomes useful only after qualification."],
      ["Start with geography and category", "The first step is controlled discovery. Flowfiy should search by business category, location, and service intent. The goal is to build a candidate pool without over-expanding into weak-fit regions or irrelevant categories. Better source boundaries make every downstream step cleaner."],
      ["Enrich and score", "Once a candidate is found, Flowfiy can enrich it with website data, contact paths, review patterns, service pages, and visible friction. Then it can score the account for fit, gap, and outreach readiness. A business with high review volume, weak conversion paths, and clear contact data should outrank a generic listing with little evidence."],
      ["Turn local context into outreach", "The strongest SMB messages are local and specific. They reference the service, the visible gap, and the likely business outcome. That might mean better booking flow, faster lead capture, review follow-up, local SEO, or automated response handling. Flowfiy's advantage is connecting discovery to useful context before the message is written."],
    ],
  },
  {
    category: "AI in 2026",
    title: "AI in 2026: Why Workflow Ownership Matters More Than Chat",
    slug: "ai-in-2026-workflow-ownership-matters-more-than-chat",
    readTime: "6 min read",
    excerpt: "The AI conversation is shifting from chat interfaces to workflow ownership. In 2026, the winning products will be the ones that complete useful work under clear controls.",
    seoTitle: "AI in 2026: Workflow Ownership Over Chat",
    metaDescription: "AI in 2026 is moving from chat assistants to workflow ownership. Learn why this matters for sales teams and Flowfiy.",
    links: [
      ["AI Agents as Coworkers", "2026-ai-agents-from-copilots-to-coworkers"],
      ["Autonomous Outbound Workflow", "autonomous-outbound-five-agent-workflow-behind-flowfiy"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
    ],
    sections: [
      ["Chat was the interface, not the destination", "Chat made AI accessible, but the long-term value is not typing prompts into a box. In 2026, the important question is whether AI can own a workflow with enough context, tools, and guardrails to produce a business outcome. For sales teams, that outcome is not a nicer email draft. It is qualified pipeline."],
      ["Workflow ownership requires state", "A workflow-owning agent needs memory of what has happened, a definition of success, and rules for what it can do next. Flowfiy's outbound motion naturally fits this model because lead discovery, research, scoring, copy, sending, and reply handling all depend on previous steps."],
      ["Controls matter more as autonomy rises", "The more an AI system can do, the more visible its boundaries must be. Teams need logs, suppression lists, safe sending limits, approved messaging claims, and human takeover points. Without those controls, autonomy becomes anxiety. With them, it becomes leverage."],
      ["The founder takeaway", "Founders should stop asking only which AI tool is most impressive and start asking which workflow it can reliably own. Flowfiy's bet is that outbound is one of the clearest workflows to delegate because the steps are repetitive, measurable, and directly tied to revenue learning."],
    ],
  },
  {
    category: "AI in 2026",
    title: "The Small Team Advantage: How AI Lets Founders Run Enterprise-Grade GTM",
    slug: "small-team-advantage-ai-founders-enterprise-grade-gtm",
    readTime: "6 min read",
    excerpt: "AI is compressing go-to-market teams. In 2026, small teams can run research, segmentation, outreach, and follow-up motions that once required large SDR operations.",
    seoTitle: "How AI Lets Founders Run Enterprise-Grade GTM",
    metaDescription: "AI lets small teams run enterprise-grade go-to-market workflows across research, segmentation, outreach, and follow-up.",
    links: [
      ["Founder Automation", "what-founders-should-automate-first-with-ai-in-2026"],
      ["AI Lead Gen Operating System", "ai-lead-generation-operating-system-source-score-sequence-learn"],
      ["Pipeline on Autopilot", "pipeline-on-autopilot-flowfiy-operating-metrics"],
    ],
    sections: [
      ["The GTM team is being compressed", "A decade ago, running outbound at scale required researchers, SDRs, copywriters, operations managers, enrichment tools, and sequence software. In 2026, AI does not remove strategy, but it compresses execution. A small team can run workflows that previously demanded a much larger operating budget."],
      ["Where small teams win", "Small teams are faster because they have fewer handoffs. If an AI system can discover leads, research context, draft outreach, and classify replies, the founder can spend time on offer refinement and conversations. Flowfiy is useful because it keeps the revenue loop moving without forcing the founder to become a full-time SDR manager."],
      ["Enterprise-grade does not mean enterprise-bloated", "The goal is not to recreate a large sales department with software. The goal is to borrow the best parts of a mature GTM engine: clear ICP, strong data, controlled sequences, compliance, and measurable learning. AI makes those habits accessible earlier."],
      ["What still belongs to humans", "Humans still own positioning, pricing, customer empathy, negotiation, and strategic judgment. AI owns the repetitive motion around those decisions. That division of labor is what makes small teams feel larger without becoming slower."],
    ],
  },
  {
    category: "AI in 2026",
    title: "Human-in-the-Loop AI Sales: Where Founders Should Stay Involved",
    slug: "human-in-the-loop-ai-sales-founders-stay-involved",
    readTime: "5 min read",
    excerpt: "Autonomous sales workflows still need human judgment. This post maps where founders should approve, supervise, or fully delegate inside an AI outbound system.",
    seoTitle: "Human-in-the-Loop AI Sales for Founders",
    metaDescription: "Learn where founders should stay involved in AI sales workflows and what can safely be delegated to Flowfiy-style automation.",
    links: [
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["Workflow Ownership", "ai-in-2026-workflow-ownership-matters-more-than-chat"],
      ["Reply Classification", "reply-classification-ai-outbound-meeting-booking"],
    ],
    sections: [
      ["Autonomy does not mean absence", "The best AI sales systems do not remove humans from the business. They remove humans from repetitive coordination. Founders should remain involved where judgment, brand risk, or customer understanding matters. The art is deciding which steps need approval and which can run automatically."],
      ["Where humans should define rules", "Founders should define the ICP, allowed offers, disallowed claims, tone boundaries, sensitive industries, escalation rules, and stop conditions. These rules give the AI a safe operating lane. Flowfiy can then execute inside that lane without asking for approval at every minor step."],
      ["Where AI can act", "AI can safely handle discovery, first-pass research, scoring suggestions, draft generation, sequence scheduling, bounce handling, and reply classification when the guardrails are clear. These tasks are repetitive and measurable. Humans can review exceptions instead of managing every lead."],
      ["The operating rhythm", "A practical human-in-the-loop rhythm is weekly, not constant. Review segment performance, inspect a sample of AI decisions, approve new messaging angles, and adjust the ICP. That keeps the founder close to learning without becoming the bottleneck."],
    ],
  },
  {
    category: "AI in 2026",
    title: "AI Workflows Are Becoming the New No-Code for Revenue Teams",
    slug: "ai-workflows-new-no-code-revenue-teams",
    readTime: "6 min read",
    excerpt: "No-code helped teams build apps without engineers. AI workflows now help revenue teams run multi-step operations without hiring every specialist role first.",
    seoTitle: "AI Workflows Are the New No-Code for Revenue Teams",
    metaDescription: "AI workflows are becoming the new no-code for revenue teams, letting small GTM teams run complex operations without heavy headcount.",
    links: [
      ["Small Team Advantage", "small-team-advantage-ai-founders-enterprise-grade-gtm"],
      ["Five-Agent Workflow", "autonomous-outbound-five-agent-workflow-behind-flowfiy"],
      ["AI Sales Updates", "latest-ai-sales-updates-agentic-workflows-outbound"],
    ],
    sections: [
      ["The no-code pattern is repeating", "No-code tools let operators build workflows that once required engineering support. AI workflows are doing something similar for revenue teams. Instead of manually stitching together sourcing, enrichment, copywriting, sequencing, and reporting, teams can define the outcome and let agents coordinate the steps."],
      ["Revenue work is full of repeatable logic", "GTM teams constantly make conditional decisions: if this lead fits, enrich it; if the website has a gap, write this angle; if the reply is interested, route it; if it is negative, suppress it. That logic is exactly where AI workflows can help."],
      ["Why Flowfiy fits the moment", "Flowfiy can become a revenue workflow layer for teams that want outcomes, not tool sprawl. The value is not just saving clicks. It is reducing the need for the founder to be the glue between disconnected tools."],
      ["The new skill", "The valuable revenue operator in 2026 will not simply know how to use more software. They will know how to define workflows, set guardrails, inspect agent decisions, and improve the system over time. That is the no-code mindset, upgraded for AI."],
    ],
  },
  {
    category: "AI Latest Updates",
    title: "What the Latest Agentic AI Shift Means for Sales Teams",
    slug: "latest-agentic-ai-shift-means-for-sales-teams",
    readTime: "6 min read",
    excerpt: "The latest AI shift is toward governed agents that complete workflows. For sales teams, this means less manual coordination and more pressure to design better operating rules.",
    seoTitle: "Latest Agentic AI Shift for Sales Teams",
    metaDescription: "The latest agentic AI shift is toward governed workflow agents. Learn what it means for modern sales teams and Flowfiy users.",
    links: [
      ["Workflow Ownership", "ai-in-2026-workflow-ownership-matters-more-than-chat"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["AI Sales Updates", "latest-ai-sales-updates-agentic-workflows-outbound"],
    ],
    sections: [
      ["The market is moving past demos", "The newest AI conversation is less about impressive chat responses and more about agents that can operate inside business workflows. Analysts and operators keep returning to the same point: the promise is real, but value only appears when agents are connected to data, tools, permissions, and measurable outcomes."],
      ["Sales is an obvious test case", "Sales teams have repeatable workflows with direct business metrics. That makes outbound a practical area for agentic AI. If the system can create qualified meetings while respecting deliverability and compliance rules, the value is easy to understand."],
      ["Governance is becoming the feature", "The latest update for AI sales is not just more autonomy. It is governed autonomy. Teams need to know why an agent selected a lead, what it wrote, when it sent, and how it handled the reply. Flowfiy's product direction should make those decisions visible."],
      ["What to do now", "Sales teams should map their workflows, define rules, and start with contained motions. Do not automate chaos. Automate a clear segment, learn from it, then expand. That is how agentic AI becomes operational instead of theatrical."],
    ],
  },
  {
    category: "AI Latest Updates",
    title: "AI Search, AI Buyers, and Why Your Outreach Needs Better Context",
    slug: "ai-search-ai-buyers-outreach-needs-better-context",
    readTime: "5 min read",
    excerpt: "AI search and AI-assisted buying are changing how prospects evaluate vendors. Outreach needs clearer context, stronger proof, and better alignment with public content.",
    seoTitle: "AI Search and AI Buyers: Why Outreach Needs Context",
    metaDescription: "AI-assisted buying changes outbound. Learn why Flowfiy-style outreach needs clear context, evidence, and alignment with public content.",
    links: [
      ["Agent-First B2B Buying", "ai-news-b2b-buying-agent-first-gtm-teams"],
      ["Content Moat", "content-moat-for-ai-outbound-flowfiy"],
      ["Research Depth", "why-research-depth-beats-email-volume-modern-cold-outreach"],
    ],
    sections: [
      ["Buyers are researching differently", "Prospects increasingly use AI tools to summarize vendors, compare options, and prepare shortlists. That changes outbound because a buyer may already have a machine-generated impression of your category before they open your email."],
      ["Context must be consistent", "Your outreach, website, blog, and product narrative should reinforce each other. If an email claims one thing but the website explains another, both humans and AI assistants may struggle to understand the offer. Flowfiy's blog cluster helps create consistent language around autonomous outbound."],
      ["Public content becomes sales infrastructure", "Blog posts are not only traffic assets. They are context assets. They explain problems, define categories, and give both buyers and AI systems a clearer map of what Flowfiy does. That is why internal links matter: they show how concepts connect."],
      ["The practical implication", "Outbound teams should write messages that can survive buyer scrutiny. Specific observations, clear offers, and educational links will outperform vague claims. AI buyers reward clarity."],
    ],
  },
  {
    category: "AI Latest Updates",
    title: "The New AI Sales Stack: Agents, Data, Deliverability, and Governance",
    slug: "new-ai-sales-stack-agents-data-deliverability-governance",
    readTime: "7 min read",
    excerpt: "The modern AI sales stack is not just an email writer. It combines agents, live data, deliverability controls, and governance so revenue teams can trust autonomous workflows.",
    seoTitle: "The New AI Sales Stack: Agents, Data, Deliverability, Governance",
    metaDescription: "Explore the new AI sales stack: agents, data, deliverability, governance, and learning loops for autonomous outbound.",
    links: [
      ["Deliverability Checklist", "cold-email-deliverability-2026-relevance-new-warmup"],
      ["Five-Agent Workflow", "autonomous-outbound-five-agent-workflow-behind-flowfiy"],
      ["Governance", "trust-layer-compliance-suppression-human-like-ai-outreach"],
    ],
    sections: [
      ["The stack is expanding", "Early AI sales tools focused heavily on copy generation. The new AI sales stack is broader. It includes data sourcing, enrichment, agent orchestration, email infrastructure, suppression, compliance, analytics, and governance. Copy is one component, not the system."],
      ["Agents need data", "An agent without fresh data becomes a fancy template engine. Strong outbound agents need business data, contact data, public context, and campaign history. Flowfiy's advantage comes from connecting those inputs before the message is written."],
      ["Deliverability is infrastructure", "Modern outbound cannot separate AI from mailbox health. The stack needs sending limits, bounce monitoring, authentication, unsubscribe handling, and engagement feedback. Otherwise, the agent may optimize for activity while damaging the channel."],
      ["Governance creates trust", "Revenue leaders will not trust black-box agents with customer-facing workflows unless decisions are inspectable. The stack needs logs, reasons, statuses, and escalation paths. Flowfiy can make autonomy feel manageable by showing the evidence behind each action."],
    ],
  },
  {
    category: "AI Latest Updates",
    title: "Why AI Sales News Keeps Coming Back to Trust and ROI",
    slug: "why-ai-sales-news-keeps-coming-back-to-trust-and-roi",
    readTime: "5 min read",
    excerpt: "The loudest AI sales headlines are about agents, but the durable themes are trust and ROI. Teams need measurable workflows, not vague automation promises.",
    seoTitle: "Why AI Sales News Keeps Returning to Trust and ROI",
    metaDescription: "AI sales news keeps returning to trust and ROI. Learn why measurable workflows matter more than vague automation promises.",
    links: [
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["Pipeline Metrics", "pipeline-on-autopilot-flowfiy-operating-metrics"],
      ["Agentic Shift", "latest-agentic-ai-shift-means-for-sales-teams"],
    ],
    sections: [
      ["The hype is easy; ROI is hard", "AI sales news is full of agent launches and bold automation claims. The hard part is proving that those agents create measurable business value. Teams do not need another promise that AI can help. They need workflows that increase qualified conversations without damaging trust."],
      ["Trust is the adoption bottleneck", "Sales leaders hesitate when they cannot inspect what an AI system is doing. Did it choose the right account? Did it make a safe claim? Did it honor an unsubscribe? Did it classify the reply correctly? These questions are not objections to AI; they are requirements for using AI in customer-facing work."],
      ["ROI needs an operating metric", "A useful AI sales system should be judged by pipeline outcomes: qualified leads found, positive replies, meetings booked, bounce rates, unsubscribe rates, cost per conversation, and time saved. Flowfiy should make those metrics visible so the product is judged by outcomes, not novelty."],
      ["The durable direction", "The AI sales tools that last will be the ones that combine automation with accountability. Trust and ROI are not boring details. They are the product."],
    ],
  },
  {
    category: "Outbound Automation",
    title: "Pipeline on Autopilot: The Metrics Flowfiy Should Optimize",
    slug: "pipeline-on-autopilot-flowfiy-operating-metrics",
    readTime: "6 min read",
    excerpt: "Autonomous outbound needs sharper metrics than emails sent. Flowfiy should optimize qualified leads, personalization depth, reply quality, meetings, and sender health.",
    seoTitle: "Pipeline on Autopilot: Flowfiy Operating Metrics",
    metaDescription: "Learn which metrics matter for autonomous outbound: qualified leads, personalization depth, reply quality, meetings, and sender health.",
    links: [
      ["Five-Agent Workflow", "autonomous-outbound-five-agent-workflow-behind-flowfiy"],
      ["AI Lead Gen Operating System", "ai-lead-generation-operating-system-source-score-sequence-learn"],
      ["Trust and ROI", "why-ai-sales-news-keeps-coming-back-to-trust-and-roi"],
    ],
    sections: [
      ["Emails sent is not the goal", "Outbound automation tools often overvalue activity metrics. Emails sent, leads imported, and sequences launched are easy to count, but they do not prove pipeline quality. Flowfiy should optimize for the metrics that indicate useful conversations are being created."],
      ["The metrics that matter", "Useful operating metrics include qualified leads found, score distribution, research completeness, personalization depth, positive reply rate, meetings booked, bounce rate, unsubscribe rate, and cost per qualified conversation. Together, these show whether the system is healthy."],
      ["Why quality metrics protect scale", "If an AI system scales weak targeting, the damage compounds. Quality metrics slow the system down where it should be cautious and speed it up where the evidence is strong. That is how autopilot becomes safer than manual spray-and-pray."],
      ["The dashboard implication", "Flowfiy's dashboard should not only show growth. It should explain the pipeline: where leads came from, why they qualified, what angle was used, how the campaign performed, and what the system learned. Autonomy becomes trusted when the metrics tell a clear story."],
    ],
  },
  {
    category: "Outbound Automation",
    title: "Reply Classification: The Missing Middle of AI Outbound",
    slug: "reply-classification-ai-outbound-meeting-booking",
    readTime: "6 min read",
    excerpt: "Outbound automation does not end when someone replies. AI reply classification turns interested, objection, unsubscribe, and out-of-office replies into the right next action.",
    seoTitle: "Reply Classification for AI Outbound and Meeting Booking",
    metaDescription: "AI reply classification helps outbound teams route interested replies, objections, unsubscribes, and meeting opportunities correctly.",
    links: [
      ["Human-in-the-Loop AI Sales", "human-in-the-loop-ai-sales-founders-stay-involved"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["Pipeline Metrics", "pipeline-on-autopilot-flowfiy-operating-metrics"],
    ],
    sections: [
      ["A reply is the beginning, not the end", "Many outbound tools focus on sending, then leave the messy middle to humans. But replies are where revenue happens. Interested replies, objections, out-of-office messages, referrals, unsubscribes, and hostile responses all require different next steps."],
      ["Classification creates routing", "AI reply classification should identify the intent of the response and route it correctly. An interested reply can trigger a meeting draft or human alert. An objection can trigger a thoughtful response. An unsubscribe should update suppression immediately. An out-of-office reply can reschedule follow-up."],
      ["Why this matters for founders", "Founders often lose momentum after replies arrive because inbox triage is fragmented. Flowfiy can reduce that friction by turning each reply into a clear action. The founder should spend time on qualified conversations, not sorting inbox noise."],
      ["The trust requirement", "Reply classification must be conservative. If the AI is unsure, it should escalate. The system should never ignore unsubscribe intent or over-interpret vague interest. Good automation is useful because it knows when not to act."],
    ],
  },
  {
    category: "Outbound Automation",
    title: "Multi-Channel Outbound Without Becoming Annoying",
    slug: "multi-channel-outbound-without-being-annoying",
    readTime: "5 min read",
    excerpt: "Email, LinkedIn, and WhatsApp can work together, but only when timing, relevance, and stop conditions are managed. Flowfiy can coordinate channels without overdoing it.",
    seoTitle: "Multi-Channel Outbound Without Becoming Annoying",
    metaDescription: "Learn how AI can coordinate email, LinkedIn, and WhatsApp outreach while respecting relevance, timing, and stop conditions.",
    links: [
      ["Deliverability 2026", "cold-email-deliverability-2026-relevance-new-warmup"],
      ["Reply Classification", "reply-classification-ai-outbound-meeting-booking"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
    ],
    sections: [
      ["More channels can mean more risk", "Multi-channel outbound sounds powerful because prospects live across email, LinkedIn, phone, and messaging apps. But adding channels without discipline can make a brand feel pushy. The question is not how many touches Flowfiy can automate. The question is which touch is appropriate next."],
      ["Coordinate the sequence", "A strong multi-channel workflow uses channels for different purposes. Email can carry the main context. LinkedIn can build familiarity. WhatsApp or direct messaging may only make sense when there is an existing relationship or explicit context. Flowfiy should coordinate these steps instead of blasting every channel at once."],
      ["Respect stop conditions", "The system needs clear stop rules: unsubscribe, negative reply, no-fit classification, bounce, meeting booked, or human takeover. Multi-channel outreach becomes trustworthy only when one signal updates the whole workflow."],
      ["Make every touch earn its place", "Each touch should add context, not repeat the same pitch. If the first email mentions a website gap, the follow-up might share a short example or ask a sharper question. Multi-channel does not mean louder. It means better-timed."],
    ],
  },
  {
    category: "Outbound Automation",
    title: "The Content Moat for AI Outbound: Why Blog Clusters Matter",
    slug: "content-moat-for-ai-outbound-flowfiy",
    readTime: "6 min read",
    excerpt: "Interlinked blog clusters help buyers and AI systems understand a category. For Flowfiy, content is not just SEO; it is sales enablement for autonomous outbound.",
    seoTitle: "The Content Moat for AI Outbound and Flowfiy",
    metaDescription: "Interlinked blog clusters create a content moat for AI outbound by helping buyers, search engines, and AI systems understand Flowfiy's category.",
    links: [
      ["AI Search and Buyers", "ai-search-ai-buyers-outreach-needs-better-context"],
      ["Agent-First Buying", "ai-news-b2b-buying-agent-first-gtm-teams"],
      ["New AI Sales Stack", "new-ai-sales-stack-agents-data-deliverability-governance"],
    ],
    sections: [
      ["Content is becoming infrastructure", "A blog is not only a publishing channel. For AI-native companies, content helps define the market, teach buyers, support outbound messages, and give AI search systems clearer context. This is why interlinked clusters matter."],
      ["Clusters create meaning", "A single post can rank for a keyword. A cluster can explain a category. When Flowfiy connects posts about AI lead generation, AI agents, deliverability, outbound automation, and trust, it creates a map of how the product thinks. That map helps readers move from one idea to the next."],
      ["Outbound gets stronger", "Sales emails become more useful when they can point to educational context. Instead of forcing every detail into a cold email, Flowfiy can use short, specific outreach and link to a deeper explanation. That improves trust and reduces cognitive load."],
      ["The moat is consistency", "Anyone can publish generic AI content. The advantage comes from a consistent point of view repeated across product, blog, outreach, and dashboard language. Flowfiy's content moat should say the same thing everywhere: outbound should run itself, but it should run with judgment."],
    ],
  },
  {
    category: "Deliverability & Trust",
    title: "The 2026 Deliverability Checklist for AI-Generated Outreach",
    slug: "2026-deliverability-checklist-ai-generated-outreach",
    readTime: "7 min read",
    excerpt: "AI-generated outreach needs strict deliverability controls. Use this checklist for authentication, list quality, bounce handling, unsubscribe, content hygiene, and engagement.",
    seoTitle: "2026 Deliverability Checklist for AI Outreach",
    metaDescription: "A practical 2026 deliverability checklist for AI-generated outreach covering SPF, DKIM, DMARC, bounces, unsubscribes, and relevance.",
    links: [
      ["Deliverability 2026", "cold-email-deliverability-2026-relevance-new-warmup"],
      ["Multi-Channel Outbound", "multi-channel-outbound-without-being-annoying"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
    ],
    sections: [
      ["AI makes discipline more important", "When AI can generate and send faster, deliverability discipline becomes more important, not less. A poorly controlled AI campaign can damage sender reputation quickly. A well-controlled campaign can protect the channel while improving relevance."],
      ["Technical checklist", "Before sending, teams should verify SPF, DKIM, and DMARC alignment, use reputable mailboxes, configure unsubscribe handling, avoid suspicious links or heavy media in early messages, monitor bounce rates, and keep daily volume conservative. These basics are not optional."],
      ["Relevance checklist", "Technical setup is only half the story. Flowfiy should also check whether the lead fits, whether there is a real reason to reach out, whether the message references supported evidence, and whether suppression rules are honored."],
      ["Operational checklist", "Track positive replies, negative replies, unsubscribes, bounces, spam complaints, and account-level performance. Pause segments that perform poorly. Re-score leads when engagement drops. Deliverability is a workflow, not a one-time setup task."],
    ],
  },
  {
    category: "Deliverability & Trust",
    title: "Why Suppression Lists Are the Memory of a Trustworthy Outbound System",
    slug: "suppression-lists-memory-trustworthy-outbound-system",
    readTime: "5 min read",
    excerpt: "Suppression lists are not a compliance afterthought. They are the memory layer that prevents AI outbound from repeating mistakes across campaigns, sources, and channels.",
    seoTitle: "Suppression Lists for Trustworthy AI Outbound",
    metaDescription: "Suppression lists are the memory layer of trustworthy AI outbound, helping Flowfiy prevent repeated unwanted contact across campaigns.",
    links: [
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["Reply Classification", "reply-classification-ai-outbound-meeting-booking"],
      ["Deliverability Checklist", "2026-deliverability-checklist-ai-generated-outreach"],
    ],
    sections: [
      ["Trust needs memory", "A trustworthy outbound system remembers what happened before. If someone unsubscribed, bounced, replied negatively, or should not be contacted, that state must follow them across future campaigns. Without memory, automation repeats mistakes."],
      ["AI increases duplicate risk", "AI agents may discover the same business through multiple sources: maps, directories, enrichment providers, imports, and web search. A central suppression list prevents those duplicate paths from turning into repeated unwanted outreach."],
      ["Suppression should be broad enough", "Suppression can operate at the email, domain, company, and campaign levels. Sometimes only one contact should be removed. Sometimes the whole company should be paused. Flowfiy should make those distinctions clear."],
      ["The product principle", "Suppression is not a hidden admin feature. It is a trust feature. It protects recipients, mailbox health, and brand reputation. In AI outbound, memory is part of morality and mechanics at the same time."],
    ],
  },
  {
    category: "Deliverability & Trust",
    title: "Sender Reputation Is a Product Feature Now",
    slug: "sender-reputation-is-a-product-feature-now",
    readTime: "6 min read",
    excerpt: "Sender reputation used to feel like a technical detail. In AI outbound, it is a product feature shaped by targeting, copy, suppression, sending limits, and reply quality.",
    seoTitle: "Sender Reputation Is a Product Feature in AI Outbound",
    metaDescription: "Sender reputation in AI outbound is shaped by targeting, copy quality, suppression, sending limits, and recipient engagement.",
    links: [
      ["Deliverability Checklist", "2026-deliverability-checklist-ai-generated-outreach"],
      ["Research Depth", "why-research-depth-beats-email-volume-modern-cold-outreach"],
      ["Pipeline Metrics", "pipeline-on-autopilot-flowfiy-operating-metrics"],
    ],
    sections: [
      ["Reputation is no longer external", "Outbound platforms used to treat sender reputation as something the user handled elsewhere. That does not work for AI outbound. If the product selects weak leads, writes generic copy, ignores suppression, or sends too aggressively, it directly harms reputation."],
      ["Product decisions affect inbox placement", "Lead scoring affects engagement. Copy quality affects replies. Sending controls affect complaint rates. Bounce handling affects domain health. Suppression affects trust. These are product-level decisions, not just email-admin tasks."],
      ["What Flowfiy should expose", "Users should see mailbox health, bounce trends, unsubscribe rates, reply quality, and risky campaigns. The system should pause or warn when signals deteriorate. A good product does not let users drive off a cliff because the send button still works."],
      ["The strategic point", "Sender reputation is now part of customer value. If Flowfiy protects it, users can run outbound longer, learn faster, and trust the system more. That makes deliverability a core feature, not a side panel."],
    ],
  },
  {
    category: "Deliverability & Trust",
    title: "How to Make AI Outreach Feel Specific Without Feeling Fake",
    slug: "make-ai-outreach-specific-without-feeling-fake",
    readTime: "5 min read",
    excerpt: "AI personalization can become creepy or false if it overreaches. The better approach is grounded specificity: mention what is observable, relevant, and useful.",
    seoTitle: "How to Make AI Outreach Specific Without Feeling Fake",
    metaDescription: "Use grounded specificity in AI outreach: observable, relevant, and useful context without fake familiarity or invented claims.",
    links: [
      ["Research Depth", "why-research-depth-beats-email-volume-modern-cold-outreach"],
      ["Trust Layer", "trust-layer-compliance-suppression-human-like-ai-outreach"],
      ["ICP an AI Can Use", "how-to-build-an-icp-ai-agent-can-use"],
    ],
    sections: [
      ["Specific is good; fake is fatal", "AI can make outreach more personal, but it can also overreach. A message that pretends to know private details or invents a relationship feels manipulative. A message that references a real, observable business detail feels useful."],
      ["Grounded specificity", "The safest personalization is grounded in public, relevant evidence: a service page, location expansion, review pattern, missing booking flow, hiring signal, or visible workflow gap. Flowfiy should use these details because they are both specific and explainable."],
      ["Avoid false intimacy", "Do not write like the sender is an old friend. Do not imply the prospect has a problem unless the evidence supports it. Do not use flattery as a substitute for relevance. Trustworthy AI outreach sounds like a sharp business observation, not a theatrical performance."],
      ["The practical formula", "A strong opener follows a simple pattern: observed signal, possible business implication, relevant offer, low-friction next step. That is enough. The goal is not to impress the recipient with personalization. The goal is to make the message worth answering."],
    ],
  },
];

function relatedMarkdown(links) {
  return `\n\n## Related reading\n\n${links.map(([label, slug]) => `- [${label}](/blog/${slug})`).join("\n")}`;
}

function body(post) {
  const parts = post.sections.map(([heading, text]) => `## ${heading}\n\n${text}`).join("\n\n");
  return `${parts}${relatedMarkdown(post.links)}\n\n## Where Flowfiy fits\n\nFlowfiy connects this idea back to autonomous outbound: find better-fit leads, research the reason to reach out, write with context, send with guardrails, and learn from the response. The product is strongest when each part of the motion improves the next one.`;
}

loadEnvLocal();

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const responseBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${JSON.stringify(responseBody)}`);
  }
  return { res, body: responseBody };
}

(async function main() {
  const { email, password } = readOwnerCredentials();
  if (!email || !password) throw new Error("Owner credentials were not found.");

  const login = await request("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = login.res.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Admin login succeeded but no admin cookie was returned.");

  const existing = await request("/api/admin/blog", { headers: { Cookie: cookie } });
  const existingBySlug = new Map((existing.body.posts || []).map((post) => [post.slug, post]));

  const results = [];
  for (const post of posts) {
    const existingPost = existingBySlug.get(post.slug);
    const payload = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      content: body(post),
      status: "PUBLISHED",
      authorName: "Flowfiy",
      readTime: post.readTime,
      isFeatured: false,
      seoTitle: post.seoTitle,
      metaDescription: post.metaDescription,
    };
    const path = existingPost ? `/api/admin/blog/${existingPost.id}` : "/api/admin/blog";
    const method = existingPost ? "PATCH" : "POST";
    const { body: result } = await request(path, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(payload),
    });
    results.push({ action: method === "POST" ? "created" : "updated", slug: result.post.slug, category: result.post.category });
  }

  console.log(JSON.stringify(results, null, 2));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
