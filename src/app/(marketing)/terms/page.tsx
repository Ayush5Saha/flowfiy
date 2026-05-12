import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Flowfiy",
  description: "Flowfiy Terms of Service. Rules governing your use of the Flowfiy AI sales outreach platform, subscriptions, data handling, and acceptable use.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  const lastUpdated = "May 12, 2026";

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
              Flowfiy is a multi-tenant SaaS platform that provides AI-powered outbound sales tooling, including ICP analysis, lead discovery, company research, qualification scoring, and email copy generation. The platform orchestrates third-party AI and data services using credentials you provide.
            </p>
            <p className="mt-3">
              You are responsible for maintaining your own API credentials (Anthropic, Apollo, Apify, Gmail, etc.) and for any usage costs those providers charge directly to your accounts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Account registration</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your login credentials</li>
              <li>You must be at least 18 years old to use the Service</li>
              <li>One person or legal entity may not maintain more than one Free tier account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscriptions and billing</h2>
            <p>
              Paid plans are billed monthly or annually in advance. Payment is processed by Razorpay. By subscribing, you authorize recurring charges to your payment method.
            </p>
            <p className="mt-3">
              Plan generation limits reset on your billing anniversary date. Unused generations do not roll over. Exceeding your plan limit will pause generation capability until the next billing cycle or you upgrade.
            </p>
            <p className="mt-3">
              Cancellations take effect at the end of the current billing period. We do not offer prorated refunds for partial months.
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
              Our collection and use of personal data is governed by our <Link href="/privacy" className="text-violet-400 hover:text-violet-300">Privacy Policy</Link>. Lead data you generate and outreach copy you create remain your data. We do not use your lead data to train AI models or share it with other tenants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. API credentials and BYOK</h2>
            <p>
              You grant Flowfiy permission to use your API credentials (Anthropic, Apollo, Apify, Gmail OAuth tokens) solely to execute the pipeline actions you initiate. Credentials are stored encrypted at rest (AES-256-GCM) and are never shared with other users or tenants.
            </p>
            <p className="mt-3">
              You are responsible for monitoring your own API usage and costs at each third-party provider. Flowfiy is not liable for unexpected costs incurred at Anthropic, Apollo, Apify, or any other connected provider.
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