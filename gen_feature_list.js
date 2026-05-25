const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Footer, AlignmentType,
  HeadingLevel, BorderStyle, PageNumber, LevelFormat,
} = require("docx");

// ── A4 dimensions (DXA) ──────────────────────────────────────────────────────
const A4_W = 11906;
const A4_H = 16838;
const MARGIN = 1134; // ~2cm
const CONTENT_W = A4_W - MARGIN * 2; // 9638

// ── Helpers ──────────────────────────────────────────────────────────────────
const spacer = (pt = 4) =>
  new Paragraph({ spacing: { before: 0, after: pt * 20 }, children: [new TextRun("")] });

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    children: [new TextRun({ text, font: "Arial", bold: true, size: 28 })],
  });
}

function featureBlock(number, name, definition, howItWorks) {
  const featureTitle = `${number}  —  ${name}`;
  return [
    // Feature title
    new Paragraph({
      spacing: { before: 280, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 },
      },
      children: [
        new TextRun({ text: featureTitle, font: "Arial", bold: true, size: 24 }),
      ],
    }),
    // Definition row
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({ text: "Definition:  ", font: "Arial", bold: true, size: 22 }),
        new TextRun({ text: definition, font: "Arial", size: 22 }),
      ],
    }),
    // How It Works row
    new Paragraph({
      spacing: { before: 60, after: 160 },
      children: [
        new TextRun({ text: "How It Works:  ", font: "Arial", bold: true, size: 22 }),
        new TextRun({ text: howItWorks, font: "Arial", size: 22, color: "333333" }),
      ],
    }),
  ];
}

// ── Feature data ─────────────────────────────────────────────────────────────
const sections = [
  {
    title: "1.  AI Pipeline & Lead Intelligence",
    features: [
      {
        number: "1.1",
        name: "ICP Analyzer",
        definition:
          "Analyzes the user's business profile and generates a structured Ideal Customer Profile used to guide all downstream lead discovery and qualification.",
        how: "When a user sets up their business profile (service offered, target industries, geographies, pain points), a Claude agent reads this data and produces a detailed ICP JSON object. This ICP is cached on the organization and passed to every subsequent agent as context. It answers: who exactly should we be targeting, and why?",
      },
      {
        number: "1.2",
        name: "Lead Discovery Agent (Apollo or Apify)",
        definition:
          "Finds leads matching the ICP from two possible sources: Apollo.io's 275M+ contact database (preferred) or Apify's leads-finder actor (free alternative). Both return validated contact details including verified email addresses.",
        how: "If Apollo is connected, the agent constructs people-search queries using ICP signals — job titles, industries, company size ranges, geographies — and writes verified contacts to the database. If only Apify is connected, the orchestrator triggers the code_crafter~leads-finder actor, which also returns validated emails plus LinkedIn URLs and firmographic data. Geography and industry inputs are normalised to each API's required enum format before the search runs. The agent deduplicates by LinkedIn URL and writes raw lead records. Discovery runs fully autonomously — no manual configuration required.",
      },
      {
        number: "1.3",
        name: "Company Analyzer Agent (Apify Website Scraper)",
        definition:
          "Scrapes each prospect's company website in real time to gather live intelligence: services, messaging clarity, tech signals, and growth indicators — enriching qualification accuracy beyond what contact databases provide.",
        how: "For each lead with a company website, an Apify website-content-crawler actor fetches and crawls the site. The Claude agent reads the scraped content and extracts structured insights — what the company does, their messaging quality, visible pain points, and growth signals like recent hires or product launches. This enrichment step is separate from lead discovery: Apify plays two roles in the pipeline — lead finder and website scraper — but each role uses a different actor.",
      },
      {
        number: "1.4",
        name: "Qualification Agent",
        definition:
          "Scores each lead 0-100 based on ICP fit and assigns QUALIFIED or DISQUALIFIED status, with a written justification.",
        how: "The agent receives the ICP analysis plus the company research and evaluates the lead across multiple dimensions: title match, company size, industry relevance, and pain point alignment. Leads scoring 60 or above are marked QUALIFIED. The score and best opportunity angle are stored for use in outreach personalization.",
      },
      {
        number: "1.5",
        name: "Personalization Agent",
        definition:
          "Writes a fully personalized cold email (subject, body, 2-3 follow-ups) for every qualified lead, grounded in real research observations.",
        how: "The agent receives the lead's company research, qualification score, and opportunity angle, then writes the complete outreach sequence. Each email references a specific, real-observed signal from the company (not generic praise). Follow-up 1 is a value-add, Follow-up 2 is a soft nudge, and Follow-up 3 is a short breakup email — each written in a founder-to-founder tone.",
      },
      {
        number: "1.6",
        name: "Lead Import Mode",
        definition:
          "Allows users to upload their own lead list (CSV) and run only the research + qualification + personalization pipeline, skipping all discovery.",
        how: "Users upload a CSV with columns like firstName, lastName, email, company, title, website. Flowfiy maps and imports the rows into a LeadList, then triggers the orchestrator in import mode — the qualification and personalization agents run, but the lead discovery step is bypassed entirely. Useful when users already have a list they want enriched and scored.",
      },
      {
        number: "1.7",
        name: "Pipeline Retry with Checkpoint Resume",
        definition:
          "Automatically retries failed pipeline jobs up to 3 times without repeating work already completed — resuming qualification from the exact lead where the previous attempt crashed.",
        how: "BullMQ retries failed jobs with exponential backoff (1 min, then 2 min) and a 20-minute hard timeout per attempt. On each retry, the processor queries leads already saved for the list and detects one of three checkpoint states: (A) no leads in DB — discovery crashed, run fresh; (B) some leads still RESEARCHING — pass only those to the orchestrator as pre-loaded leads, skip search_leads entirely, and carry forward the qualified count from the previous attempt; (C) all leads already done — finalization crashed, just mark the list READY. Logs are preserved across retries with a separator so the full run history is visible in the live log panel.",
      },
    ],
  },
  {
    title: "2.  Campaign & Outreach Management",
    features: [
      {
        number: "2.1",
        name: "Campaign Creation & Management",
        definition:
          "Campaigns group a lead list with outreach settings (from address, Calendly link, daily send limit) and control the entire outreach lifecycle.",
        how: "Users create a campaign by selecting a READY lead list and configuring settings. The campaign moves through statuses: DRAFT, ACTIVE, PAUSED, COMPLETED. All emails sent, follow-ups queued, replies detected, and meetings booked are tracked against the campaign and aggregated into campaign-level metrics.",
      },
      {
        number: "2.2",
        name: "Email Copy Approval Workflow",
        definition:
          "Every AI-generated email must be reviewed and approved by the user before it can be sent in a campaign — preventing unreviewed copy from reaching prospects.",
        how: "After the AI pipeline runs, each OutreachCopy record has isApproved set to false. The campaign launch endpoint checks for unapproved copies and returns a 422 error with the count if any exist. Users can approve individually or bulk-approve the entire campaign. Editing any content field automatically revokes approval, forcing a re-review.",
      },
      {
        number: "2.3",
        name: "Campaign Launch with Deduplication",
        definition:
          "Launching a campaign queues all pending lead emails into the job system, with automatic cross-list deduplication to prevent double-contacting prospects.",
        how: "At launch, Flowfiy checks whether any lead email address has already been contacted (SENT, OPENED, or REPLIED status) in another active or completed campaign for the same organization. Duplicates are reported at launch time, and the email processor also skips them at send time. This prevents the same prospect from receiving cold emails from two different campaigns simultaneously.",
      },
      {
        number: "2.4",
        name: "Multi-Step Follow-Up Sequences",
        definition:
          "Each campaign automatically sends up to 3 follow-up emails per lead at configured intervals, stopping immediately if the prospect replies.",
        how: "The follow-up scheduler runs daily and queries the database for leads where the delay threshold has elapsed: Follow-up 1 (default 3 days after initial), Follow-up 2 (default 7 days), Follow-up 3 (default 14 days, a final breakup email). Each step is enqueued as a separate job that sends in the same Gmail thread. The scheduler checks for replies before queuing, so a replied lead never receives a follow-up.",
      },
      {
        number: "2.5",
        name: "Configurable Follow-Up Timing",
        definition:
          "Users can change the number of days between follow-ups on a live campaign, and the new timing takes effect immediately for all unsent follow-ups.",
        how: "The timing endpoint accepts followUp1DelayDays, followUp2DelayDays, and followUp3DelayDays. Because timing is evaluated at queue time (not at job creation time), changing these values mid-campaign affects all leads that have not yet reached that follow-up step. The endpoint also returns counts of how many pending follow-ups will be affected by the change.",
      },
      {
        number: "2.6",
        name: "Campaign A/B Testing",
        definition:
          "Splits campaign leads into two variants (A and B) at launch to test which email copy gets better open and reply rates.",
        how: "When abTestEnabled is true on a campaign, the launch endpoint alternates lead assignments: lead 1 to variant A, lead 2 to variant B, and so on. This creates an equal 50/50 split. After sending, the ab-results endpoint returns per-variant sent, opened, and replied counts with open rates and reply rates. The system automatically declares a winner when both variants have at least 10 sends and one clearly outperforms the other.",
      },
      {
        number: "2.7",
        name: "Reply Detection (Gmail Polling)",
        definition:
          "Automatically detects when a prospect replies to an outreach email by polling Gmail threads, and immediately stops any further follow-ups to that lead.",
        how: "The daily cron job fetches each active campaign lead's Gmail thread using the Gmail API. If a thread has more than one message, a reply has been received. The lead and campaign lead are atomically updated to REPLIED status, and the reply count on the campaign is incremented. Reply detection always runs before the follow-up scheduler so that no follow-up is ever queued for a lead who has already responded.",
      },
      {
        number: "2.8",
        name: "AI Reply Classification",
        definition:
          "When a reply is detected, Claude Haiku classifies the reply intent into one of six categories so users know what each prospect said without reading every email.",
        how: "The reply text is extracted from the Gmail thread and sent to Claude Haiku with a classification prompt. The model returns exactly one category: INTERESTED, NOT_INTERESTED, OOO (out of office), REFERRAL, UNSUBSCRIBE, or OTHER. The intent and a 300-character reply snippet are stored on the CampaignLead record. If Claude is unavailable, the system degrades gracefully and stores OTHER.",
      },
    ],
  },
  {
    title: "3.  Deliverability & Compliance",
    features: [
      {
        number: "3.1",
        name: "Email Open Tracking",
        definition:
          "Embeds a 1x1 transparent tracking pixel in every outreach email to detect when a prospect opens it, without requiring any action from the prospect.",
        how: "When an HTML email is built, a unique tracking URL is embedded as an invisible image. When the email client loads the image, the server records the open event — setting status to OPENED on first open, recording the timestamp, and incrementing an open counter. The pixel returns a valid 1x1 GIF with Cache-Control: no-store so clients always fetch it fresh.",
      },
      {
        number: "3.2",
        name: "Unsubscribe Link & Suppression",
        definition:
          "Every outreach email includes a one-click unsubscribe link. Clicking it permanently adds the email address to the organization's suppression list.",
        how: "Each email contains a unique HMAC-SHA256 signed unsubscribe URL. When clicked, the server verifies the token signature, atomically marks the CampaignLead as UNSUBSCRIBED, and upserts the email into the SuppressedEmail table. Future emails to that address are blocked before send, even in new campaigns. The unsubscribe page returns a branded HTML confirmation rather than a raw JSON response.",
      },
      {
        number: "3.3",
        name: "Bounce Detection & Hard Bounce Suppression",
        definition:
          "Classifies Gmail send failures as HARD, SOFT, or SPAM bounces, and automatically adds hard-bounced addresses to the suppression list to protect sender reputation.",
        how: "Every email send is wrapped in error handling. If the Gmail API throws an error, the error message is scanned for SMTP codes and keywords: 550/551/553 or user-unknown patterns become a HARD bounce; spam or blocked signals become SPAM; everything else is SOFT. Hard bounces are added to the suppression list and also fire a bounce.detected webhook event. Soft bounces are recorded but not suppressed.",
      },
      {
        number: "3.4",
        name: "Email Suppression List",
        definition:
          "An organization-scoped list of email addresses permanently blocked from receiving outreach — populated automatically by unsubscribes and hard bounces, or added manually.",
        how: "The SuppressedEmail table stores email and reason (unsubscribed, bounced, or manual) per organization. Before every email send, the processor queries this table. If the address is found, the send is skipped and the CampaignLead is marked UNSUBSCRIBED. The suppression check runs on initial sends and all follow-up steps, so suppressed addresses can never be emailed regardless of which campaign they are in.",
      },
      {
        number: "3.5",
        name: "Timezone-Aware Send Scheduling",
        definition:
          "Ensures emails are only sent during business hours (08:00-18:00) in the prospect's local timezone — improving open rates and respecting recipients.",
        how: "Each Lead record stores an optional IANA timezone string such as Asia/Kolkata or America/New_York. A library of 50+ country-to-timezone mappings resolves the timezone when not explicitly set. The follow-up scheduler pre-filters leads outside their local send window, skipping them for reconsideration on the next cron run. The email processor also throws an error for out-of-window sends, causing BullMQ to retry at the correct time.",
      },
    ],
  },
  {
    title: "4.  Integrations",
    features: [
      {
        number: "4.1",
        name: "AI Engine (Flowfiy Managed or BYOK)",
        definition:
          "Paid plans (Starter, Growth, Agency) include fully managed Claude Sonnet — no API key required. Free and Indie plans use BYOK (Bring Your Own Key), connecting their own Anthropic key. Both modes use the same 5-agent Claude pipeline.",
        how: "Each organization has an apiMode field: CENTRAL (Flowfiy pays, key from env) or BYOK (user's key from encrypted DB). A shared getClaudeClientForOrg() function reads apiMode and returns the appropriate Anthropic client. CENTRAL mode is the default for Starter and above; FREE and INDIE plans are locked to BYOK. On paid plans, users can toggle between modes from the Integrations page. BYOK keys are encrypted with AES-256-GCM and never logged.",
      },
      {
        number: "4.2",
        name: "Gmail Integration (OAuth 2.0)",
        definition:
          "Connects a user's Gmail account via Google OAuth so Flowfiy can send outreach emails directly from their own inbox, not from a shared sending domain.",
        how: "The user initiates a Google OAuth 2.0 flow requesting gmail.send and gmail.readonly scopes. The returned refresh token is encrypted and stored. Every email send decrypts this token, exchanges it for a short-lived access token, and calls the Gmail API to send the message. All emails appear to come from the user's real Gmail address with full threading support.",
      },
      {
        number: "4.3",
        name: "Apollo.io Integration",
        definition:
          "Connects Apollo.io to enable automated lead discovery from its 275M+ contact database based on ICP-derived search parameters.",
        how: "The user provides their Apollo API key, which is validated by making a test search call. The key is encrypted and stored. During lead generation, the ICP Analyzer generates search parameters that are passed to the Apollo people-search and mixed-people-search API endpoints. Results include contact details, company data, and LinkedIn URLs, all of which are stored as raw lead records.",
      },
      {
        number: "4.4",
        name: "Apify Integration (Lead Discovery + Web Scraping)",
        definition:
          "Connects Apify for two distinct pipeline roles: (1) lead discovery using the leads-finder actor when Apollo is not connected, and (2) website scraping using the website-content-crawler actor to enrich company research.",
        how: "The user provides their Apify API token, validated on save. Role 1 — Lead Discovery: the leads-finder actor accepts job titles, industries, and geographies (normalised to enum format) and returns contacts with validated emails and LinkedIn URLs. It activates automatically when Apollo is not connected. Role 2 — Website Scraping: the website-content-crawler actor fetches homepage and about-page content for each lead's company URL, returning scraped text that feeds the Company Analyzer agent. The free tier provides $5/month of compute, typically sufficient for 25-50 lead lists. Apify or Apollo — at least one must be connected to run the pipeline.",
      },
      {
        number: "4.5",
        name: "Calendly Integration",
        definition:
          "Auto-inserts the user's Calendly scheduling link into every personalized outreach email so prospects can book a meeting in one click.",
        how: "The user connects their Calendly account and selects an event type. The Calendly link is stored on the campaign settings. When the Personalization Agent writes emails, it receives the link in its system prompt and weaves it naturally into the call-to-action. No separate calendar management is needed — Calendly handles availability and booking entirely.",
      },
      {
        number: "4.6",
        name: "Outgoing Webhooks",
        definition:
          "Sends real-time signed HTTP POST notifications to any external URL (Zapier, Make, custom CRM) when key events happen in Flowfiy.",
        how: "Users create webhook endpoints by specifying a URL and which events to subscribe to. When a subscribed event fires — lead.qualified, reply.received, bounce.detected, unsubscribe.received — Flowfiy POSTs a JSON payload signed with HMAC-SHA256 to the endpoint. The signature travels in the X-Flowfiy-Signature header so receiving systems can verify authenticity. Endpoints that fail 10 consecutive deliveries are automatically disabled.",
      },
    ],
  },
  {
    title: "5.  Billing & Subscriptions",
    features: [
      {
        number: "5.1",
        name: "Razorpay Billing (India)",
        definition:
          "Handles subscription billing for Indian users in INR using Razorpay's subscription API — the default gateway for IN-country users.",
        how: "When an Indian user upgrades, the server calls Razorpay to create a subscription and returns the subscription ID and API key to the frontend. The Razorpay.js modal opens in the browser for payment. On success, Razorpay sends a webhook that verifies the HMAC signature, updates the organization's plan and generation limit, and creates an audit log entry.",
      },
      {
        number: "5.2",
        name: "Stripe Billing (International)",
        definition:
          "Handles subscription billing for users outside India in USD using Stripe Checkout — automatically selected based on the user's detected country.",
        how: "Non-Indian users are routed to Stripe. The server creates a Stripe Checkout Session with metadata linking it to the organization and plan, then redirects the user to Stripe's hosted payment page. Stripe sends lifecycle events to the stripe-webhook endpoint: checkout.session.completed activates the plan, invoice.payment_succeeded marks renewal, and customer.subscription.deleted reverts the org to the FREE plan.",
      },
      {
        number: "5.3",
        name: "Geo-Based Currency Display",
        definition:
          "Detects the user's country from their IP address and displays pricing in their local currency on the landing page and billing page.",
        how: "The /api/geo endpoint reads the x-vercel-ip-country header injected by Vercel's edge network (no external API call needed) and returns the user's country code with the mapped currency — INR, USD, AED, GBP, EUR, SGD, and more. The pricing section converts plan prices from an INR base using exchange rates and displays formatted local prices, such as $59/mo or AED 217/mo for international visitors.",
      },
      {
        number: "5.4",
        name: "Usage Tracking & Generation Limits",
        definition:
          "Tracks how many lead generation runs each organization has consumed against their plan's monthly limit — enforced before every pipeline run.",
        how: "Each lead generation job increments the organization's generationCount in the database. Before starting a new job, the system checks generationCount against generationLimit. If at or over the limit, the job is rejected with a 402 response. The limit resets monthly and is updated when a user upgrades. Usage is visible on the dashboard and billing page as a progress bar with a remaining count.",
      },
      {
        number: "5.5",
        name: "Billing Portal & Cancellation",
        definition:
          "Allows users to manage or cancel their subscription directly from the Flowfiy dashboard, routing to Razorpay or Stripe depending on their billing gateway.",
        how: "The billing portal endpoint checks the organization's billingGateway field. For Razorpay users, it calls the cancel subscription API and sets status to pending_cancellation so the plan remains active until the period ends. For Stripe users, it creates a Stripe Billing Portal Session and returns the portal URL — Stripe's hosted interface then handles cancellation, payment method updates, and invoice history.",
      },
      {
        number: "5.6",
        name: "Indie Plan (Solo Founder Tier)",
        definition:
          "A low-cost entry plan for solo founders who want to run their own Anthropic key. Priced at $20/month, it provides 2,500 generations, 1 seat, and 3 active campaigns — locked to BYOK mode.",
        how: "The INDIE plan sits between FREE and STARTER in the plan hierarchy and is always locked to BYOK API mode (no central AI access). It is available via both Razorpay (INR pricing) and Stripe (USD pricing). The plan is displayed throughout the admin panel with a distinct teal color badge, and on the billing page like other paid plans. Orgs on INDIE cannot use Apify for lead discovery (cost control), but can still use it for website scraping if connected.",
      },
      {
        number: "5.7",
        name: "Monthly AI Token Budget",
        definition:
          "A secondary safety cap that limits how many Claude API tokens an organization can consume per calendar month in CENTRAL mode — preventing runaway spend from abnormally large jobs.",
        how: "Each plan has a fixed monthly token budget: Starter 6M tokens (~$18 cost), Growth 20M tokens (~$60 cost), Agency unlimited. The processor checks the budget before every pipeline run via checkTokenBudget(). If the budget is exceeded, the job is rejected with a clear error. After each successful run, incrementTokenUsage() adds the job's input + output token count to the organization's monthlyTokensUsed counter. The budget auto-resets on the first run of a new calendar month by comparing tokenBudgetResetAt to the current month. Usage is visible on the user's billing page as a progress bar, and in the admin AI Usage dashboard per organization.",
      },
    ],
  },
  {
    title: "6.  Platform Infrastructure",
    features: [
      {
        number: "6.1",
        name: "Multi-Tenant Organization System",
        definition:
          "Every user belongs to one or more organizations. All data — leads, campaigns, integrations, billing — is scoped to the organization, not the individual user.",
        how: "The Organization model is the root tenant. Every database table includes an organizationId foreign key. API routes verify organization membership before any data access. A user can belong to multiple organizations, for example an agency managing multiple client accounts. Role-based access (OWNER, ADMIN, MEMBER) controls what actions each member can perform.",
      },
      {
        number: "6.2",
        name: "AES-256-GCM Credential Encryption",
        definition:
          "All API keys and OAuth tokens stored in the database are encrypted at rest using AES-256-GCM so that a database breach never exposes user credentials.",
        how: "An ENCRYPTION_KEY environment variable (a 32-byte hex secret) is used as the encryption key. Every integration credential object is serialized to JSON, then encrypted using Node.js's crypto module with a random 12-byte IV. The encrypted payload is stored in the encryptedCredentials column. Decryption happens in memory at runtime and the plaintext key is never persisted anywhere.",
      },
      {
        number: "6.3",
        name: "BullMQ Job Queue (Async Processing + Retry)",
        definition:
          "All email sends and lead generation pipeline runs are processed asynchronously via BullMQ, backed by Upstash Redis — with automatic retries, exponential backoff, job timeouts, and checkpoint-aware resume logic.",
        how: "When a campaign launches, email jobs are enqueued in the email-send queue. When a lead list is created, a lead-generation-pipeline job is enqueued. A Worker process on Railway consumes these queues. The lead-generation queue uses 3 attempts with exponential backoff (1 min, then 2 min) and a 20-minute hard timeout per attempt. On retry, the processor detects a checkpoint in the DB and resumes from where the previous attempt left off rather than starting over. Email send jobs use 2 attempts with a fixed 5-second delay. API endpoints return immediately while heavy processing runs in the background.",
      },
      {
        number: "6.4",
        name: "Scheduled Cron Jobs (Vercel)",
        definition:
          "Three scheduled jobs handle recurring platform tasks: daily follow-up processing, monthly usage reset, and daily stuck-job cleanup — all protected by CRON_SECRET bearer authentication.",
        how: "Vercel Cron triggers three endpoints on schedule: (1) /api/campaigns/process-followups at 09:00 UTC daily — polls Gmail for replies, classifies them with Claude Haiku, and queues due follow-up emails; (2) /api/billing/reset-usage at midnight on the 1st of each month — resets generationCount to 0 for all FREE, INDIE, and STARTER organizations; (3) /api/cron/cleanup-stuck-leads at 02:00 UTC daily — finds lead lists stuck in RESEARCHING or QUEUED for over 2 hours and marks them FAILED, and marks individual stuck leads as DISQUALIFIED so list finalization is never blocked by phantom in-progress rows.",
      },
      {
        number: "6.5",
        name: "Real-Time Job Logs",
        definition:
          "Streams live progress logs from the AI pipeline back to the user's browser so they can see exactly what each agent is doing in real time.",
        how: "The lead generation processor writes structured log entries (message, level, timestamp) to a Redis key scoped to the leadListId as each pipeline step completes. The frontend polls the logs endpoint to fetch the latest entries and renders them as a live activity feed. Log entries are categorized as info, success, error, or tool — the last showing which Claude tool was called.",
      },
      {
        number: "6.6",
        name: "Audit Logs",
        definition:
          "Records every significant action in the system — billing changes, plan upgrades, cancellations — with actor, action, resource, and metadata for compliance and debugging.",
        how: "The createAuditLog() helper writes to the AuditLog table whenever a billing event or significant platform action occurs. Each record stores organizationId, userId if user-initiated, action string, resourceType and resourceId, and a JSON metadata blob. Audit logs are append-only and never deleted, providing a permanent audit trail.",
      },
      {
        number: "6.7",
        name: "Admin Panel",
        definition:
          "A secure internal dashboard for Flowfiy operators covering four areas: organization management, system health monitoring, per-org AI usage analytics, and platform controls — all without direct database access.",
        how: "Admin routes (/admin/*) are protected by a separate ADMIN_PASSWORD cookie-based session, completely decoupled from user auth. The panel has four main sections: (1) Organizations — lists all orgs with plan, generation count, usage %, billing gateway, and creation date; per-org detail page allows manually adjusting plan, generationLimit, generationCount, and apiMode, banning/unbanning an org (which blocks all pipeline runs and logins for that org), resetting the monthly generation count, and toggling between CENTRAL and BYOK API modes. (2) System Health — shows live counts of active lead lists, queued jobs, recent failures, and stuck-lead events from the past 24 hours; surface-level Redis/BullMQ queue depth indicators. (3) AI Usage — per-org breakdown of monthlyTokensUsed vs. budget, ranked by consumption; allows admins to manually reset an org's token counter mid-month if billing disputes arise; highlights orgs approaching or exceeding their token budget. (4) Audit Log — chronological feed of all billing events, plan changes, and admin actions with actor, timestamp, and metadata for compliance and debugging.",
      },
      {
        number: "6.8",
        name: "Lead Export (CSV)",
        definition:
          "Exports the complete lead list — including research data, qualification scores, and outreach copy — as a downloadable CSV file.",
        how: "The export endpoint queries all leads with their research and outreach copy, then builds a CSV string with columns including name, email, title, company, industry, status, score, opportunity angle, pain point match, personalization notes, subject line, and email body. The response is delivered with a Content-Disposition: attachment header so the browser downloads it directly.",
      },
    ],
  },
];

// ── Build document ────────────────────────────────────────────────────────────
const children = [];

// ── Cover block ───────────────────────────────────────────────────────────────
children.push(
  new Paragraph({ spacing: { before: 0, after: 120 }, children: [] }),
  new Paragraph({
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text: "Flowfiy",
        font: "Arial",
        bold: true,
        size: 64,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 0, after: 160 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 8, color: "222222", space: 8 },
    },
    children: [
      new TextRun({
        text: "Complete Feature List",
        font: "Arial",
        bold: true,
        size: 40,
      }),
    ],
  }),
  new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new TextRun({
        text: "Every capability built into the platform, explained simply.",
        font: "Arial",
        italics: true,
        size: 24,
        color: "555555",
      }),
    ],
  }),
  spacer(20),
  // Intro paragraph
  new Paragraph({
    spacing: { before: 0, after: 0 },
    children: [
      new TextRun({
        text: "Flowfiy is a full-stack AI outbound platform built on a 5-agent Claude pipeline. Below is every feature shipped into production, organized by category. Each feature is defined and explained so any team member, investor, or partner can understand what it does and how it works under the hood.",
        font: "Arial",
        size: 22,
        color: "333333",
      }),
    ],
  }),
  spacer(8),
  new Paragraph({
    spacing: { before: 0, after: 80 },
    children: [
      new TextRun({
        text: `Total features documented: ${sections.reduce((a, s) => a + s.features.length, 0)}   |   Sections: ${sections.length}   |   Version: 1.0   |   Date: May 2026`,
        font: "Arial",
        size: 18,
        color: "888888",
      }),
    ],
  })
);

// ── Feature sections ──────────────────────────────────────────────────────────
for (const section of sections) {
  children.push(sectionHeading(section.title));
  for (const f of section.features) {
    children.push(...featureBlock(f.number, f.name, f.definition, f.how));
  }
}

// ── Assemble document ─────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "111111" },
        paragraph: {
          spacing: { before: 480, after: 200 },
          outlineLevel: 0,
        },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: A4_W, height: A4_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "Flowfiy Platform Documentation  |  Confidential  |  Page ",
                  font: "Arial",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: "Arial",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  text: " of ",
                  font: "Arial",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: "Arial",
                  size: 16,
                  color: "888888",
                }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(
    "E:\\CodeX Developemt\\AI_Sales_outbound_system\\Flowfiy_Feature_List.docx",
    buf
  );
  console.log("Written: Flowfiy_Feature_List.docx");
});
