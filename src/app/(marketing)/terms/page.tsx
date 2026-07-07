import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Flowfiy Terms of Service. Rules governing your use of the Flowfiy AI sales outreach platform, subscriptions, data handling, and acceptable use.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

// Statically pre-render — always reachable with a fast 200, no runtime deps.
export const dynamic = "force-static";

export default function TermsPage() {
  const lastUpdated = "June 23, 2026";

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Legal</span>
          <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance</h2>
            <p>
              By accessing or using Flowfiy (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users — individuals and organizations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of service</h2>
            <p>
              Flowfiy is a multi-tenant SaaS platform that provides AI-powered outbound sales. You describe the leads you want in plain English; Flowfiy finds matching businesses and people, researches and scores each lead 0-100, and writes personalized cold emails and follow-ups that you send from your own Gmail after review.
            </p>
            <p className="mt-3">
              The AI and data sources are fully managed by Flowfiy — there are no API keys to provide and no per-tool setup. You connect your Gmail account so the Service can send the outreach you approve.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account registration</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your login credentials</li>
              <li>You must be at least 18 years old to use the Service</li>
              <li>A limited free trial is available; continued use beyond the trial requires an active paid subscription</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscriptions, credits and billing</h2>
            <p>
              Flowfiy is sold as a subscription: $50 per month, which grants 400 credits per billing cycle. Payment is processed by Razorpay (India) or Stripe (international). By subscribing, you authorize recurring charges to your payment method. Prices are exclusive of taxes; applicable GST or other sales taxes are added at checkout and passed through to the relevant authority.
            </p>
            <p className="mt-3">
              Credits are a prepaid, in-app unit used to meter lead generation (1 credit = ₹10 in value). They are an advance payment for future services and are recognized as revenue only as they are consumed; until then they are held as deferred revenue. Credits have no cash value, are non-transferable, and cannot be exchanged for currency.
            </p>
            <p className="mt-3">
              Each search reserves an estimated number of credits and is charged the actual cost when it completes — never more than the estimate you approve. A search that returns no qualified leads is not charged. Plan credits roll over once into the following cycle and expire 60 days after they are issued; purchased top-up credits follow the same 60-day expiry.
            </p>
            <p className="mt-3">
              Cancellations take effect at the end of the current billing period. We do not offer prorated refunds for partial months. Refunds are governed by our <Link href="/refund" className="text-violet-400 hover:text-violet-300">Refund &amp; Cancellation Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Acceptable use</h2>
            <p>You agree not to use Flowfiy to:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 mt-3">
              <li>Send unsolicited commercial messages in violation of applicable anti-spam laws (CAN-SPAM, CASL, GDPR)</li>
              <li>Harvest or collect data in violation of third-party providers&apos; terms of service</li>
              <li>Impersonate any person or organization in outreach emails</li>
              <li>Generate or send content that is deceptive, defamatory, or unlawful</li>
              <li>Attempt to reverse engineer, copy, or resell the platform&apos;s AI pipeline logic</li>
              <li>Use the platform in any way that violates GDPR, CCPA, or other applicable data protection laws</li>
            </ul>
            <p className="mt-4">
              You are solely responsible for the outreach content sent via your Gmail account and for compliance with applicable email marketing regulations in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data and privacy</h2>
            <p>
              Our collection and use of personal data is governed by our <Link href="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>, including our <Link href="/privacy#cookies" className="text-violet-400 hover:text-violet-300">cookie &amp; consent practices</Link>. Lead data you generate and outreach copy you create remain your data. We do not use your lead data to train AI models or share it with other tenants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. AI and data providers</h2>
            <p>
              The AI model and lead-data sources used by Flowfiy — Google (Gemini), Apify, and Prospeo — are operated and paid for by Flowfiy. You do not provide, and are not billed by, any third-party AI or data provider. The only credential you connect is your Gmail OAuth token, used solely to send the outreach you approve; it is stored encrypted at rest (AES-256-GCM) and is never shared with other users or tenants.
            </p>
            <p className="mt-3">
              Your use of the Service is metered by credits as described in Section 4. Flowfiy absorbs all underlying provider costs, so you are never exposed to per-token, per-API, or per-tool charges from those providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual property</h2>
            <p>
              The Flowfiy platform, including its pipeline architecture, prompt engineering, UI, and documentation, is owned by Flowfiy and protected by copyright and trade secret law.
            </p>
            <p className="mt-3">
              AI-generated content (ICP analyses, company research, outreach copy) generated using your account is owned by you. You grant Flowfiy a limited license to store and display this content within your workspace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimers and limitation of liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. Flowfiy does not guarantee that AI-generated lead scores, company analyses, or outreach copy will achieve any particular business result.
            </p>
            <p className="mt-3">
              To the maximum extent permitted by law, Flowfiy&apos;s total liability to you for any claims arising from use of the Service is limited to the amount you paid in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these terms, engage in fraudulent activity, or if your payment fails and is not resolved within 7 days. You may cancel your account at any time from your billing settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to terms</h2>
            <p>
              We may update these terms from time to time. Material changes will be communicated by email at least 14 days in advance. Continued use after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Governing law</h2>
            <p>
              These terms are governed by applicable law. Any disputes will be resolved through binding arbitration unless you opt out within 30 days of account creation by emailing <span className="text-violet-400">legal@flowfiy.com</span>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p>
              Questions about these terms? Email <span className="text-violet-400">legal@flowfiy.com</span>.
            </p>
          </section>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        <div className="flex gap-4">
          <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy →</Link>
        </div>
      </div>
    </div>
  );
}