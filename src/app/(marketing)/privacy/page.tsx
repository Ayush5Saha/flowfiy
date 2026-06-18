import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Flowfiy's privacy policy. How we collect, use, store, and protect your data — including your Gmail connection, lead data, and email content.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const lastUpdated = "June 16, 2026";

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Legal</span>
          <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p>
              Flowfiy (&quot;we&quot;, &quot;our&quot;, or &quot;the platform&quot;) is a multi-tenant SaaS platform that provides AI-powered outbound sales tooling. We take your privacy seriously. This policy explains what data we collect, why we collect it, how we store and protect it, and what rights you have.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data we collect</h2>
            <h3 className="text-base font-medium text-white mb-2">Account data</h3>
            <p>When you create an account: email address, name, and (optionally) Google profile data if you sign in with Google OAuth.</p>

            <h3 className="text-base font-medium text-white mb-2 mt-5">Connected accounts</h3>
            <p>
              When you connect your Gmail account so Flowfiy can send approved outreach on your behalf, the OAuth tokens are encrypted at rest using AES-256-GCM before storage. The encryption key is stored in our infrastructure environment variables and is never stored in the database. We cannot read your tokens in plaintext. The AI model and lead data sources are fully managed by Flowfiy — you never bring your own API keys.
            </p>

            <h3 className="text-base font-medium text-white mb-2 mt-5">Lead and outreach data</h3>
            <p>
              The plain-English descriptions of the leads you want, matching businesses and people we find and enrich, AI-generated qualification scores, and the cold emails and follow-ups we draft are stored in your workspace and are never shared with other tenants.
            </p>

            <h3 className="text-base font-medium text-white mb-2 mt-5">Usage data</h3>
            <p>
              We track credit usage to manage your subscription, process top-ups, and provide usage dashboards. We do not sell usage data.
            </p>

            <h3 className="text-base font-medium text-white mb-2 mt-5">Payment data</h3>
            <p>
              Payment processing is handled entirely by Razorpay. Flowfiy never stores credit card numbers or payment instrument details. We store only Razorpay subscription and customer IDs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How we use your data</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>To authenticate you and maintain your session</li>
              <li>To run the AI pipeline on your behalf using Flowfiy-managed AI and data providers</li>
              <li>To meter credit usage and reconcile it against your subscription and top-ups</li>
              <li>To send transactional emails (account verification, password reset)</li>
              <li>To improve platform reliability and fix bugs (aggregate, anonymized error data)</li>
            </ul>
            <p className="mt-4">We do not use your lead data, outreach copy, or business profile to train AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data sharing</h2>
            <p>We do not sell your data. We share data with the following sub-processors only as necessary to operate the platform:</p>
            <div className="mt-4 rounded-xl border border-white/6 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-white/8">
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Sub-processor</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Purpose</th>
                    <th className="text-left py-3 px-4 font-medium text-zinc-400">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Supabase", "Database, authentication, file storage", "US / EU"],
                    ["Railway", "Background worker infrastructure", "US"],
                    ["Upstash", "Redis job queue", "US"],
                    ["Razorpay", "Payment processing (India)", "India / Global"],
                    ["Stripe", "Payment processing (international)", "US / Global"],
                    ["Vercel", "Web application hosting", "Global CDN"],
                    ["Google (Gemini)", "Managed AI inference for the pipeline", "US / Global"],
                    ["Apify", "Lead discovery (Google Maps & B2B sources)", "US / EU"],
                    ["Prospeo", "B2B email resolution", "EU"],
                  ].map(([name, purpose, loc]) => (
                    <tr key={name as string} className="bg-zinc-900/20">
                      <td className="py-2.5 px-4 text-zinc-300">{name}</td>
                      <td className="py-2.5 px-4 text-zinc-400">{purpose}</td>
                      <td className="py-2.5 px-4 text-zinc-500">{loc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data retention</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>Account data: retained while your account is active and for 30 days after deletion</li>
              <li>Lead and outreach data: retained while your account is active; deleted within 30 days of account deletion</li>
              <li>Encrypted credentials: deleted immediately upon disconnecting an integration</li>
              <li>Usage events: retained for 12 months for billing reconciliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Your rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 mt-3">
              <li>Access a copy of the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Object to processing of your data</li>
              <li>Data portability (export your leads and outreach copy as CSV/JSON)</li>
            </ul>
            <p className="mt-4">To exercise any of these rights, email us at <span className="text-violet-400">privacy@flowfiy.com</span>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Security</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>All API credentials encrypted with AES-256-GCM at rest</li>
              <li>All data in transit encrypted with TLS 1.3</li>
              <li>Row-level security (RLS) enforces tenant isolation at the database level</li>
              <li>Authentication via Supabase Auth with JWT RS256 signing</li>
              <li>No plaintext storage of passwords or API keys anywhere in the system</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>
              Flowfiy uses only essential cookies — session cookies required for authentication. We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. Material changes will be communicated via email to registered users at least 14 days before they take effect. Continued use of the platform after a policy update constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>
              Questions about this privacy policy? Email <span className="text-violet-400">privacy@flowfiy.com</span> or write to: Flowfiy, Privacy Team.
            </p>
          </section>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}