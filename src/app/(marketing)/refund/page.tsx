import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Flowfiy's refund and cancellation policy. Understand how to cancel your subscription, what happens to your data, and when refunds are issued.",
  alternates: { canonical: "/refund" },
  robots: { index: true, follow: true },
};

export default function RefundPage() {
  const lastUpdated = "June 23, 2026";

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Legal</span>
          <h1 className="text-4xl font-bold text-white mb-3">Refund &amp; Cancellation Policy</h1>
          <p className="text-zinc-500 text-sm">Last updated: {lastUpdated}</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        <div className="prose prose-invert prose-zinc max-w-none space-y-10 text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p>
              Flowfiy operates on a subscription-based model. This policy explains how cancellations work, when refunds are issued, and what happens to your data after you cancel. We aim to be straightforward — no hidden conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Subscription and credits</h2>
            <p>
              Flowfiy is subscription-based — $50/month for 400 credits — with a limited free trial for new accounts. Credits are a prepaid in-app unit (1 credit = ₹10 in value) that meters lead generation; they are an advance payment for future services and are non-refundable except as set out below. A search reserves an estimated number of credits and is charged only the actual cost when it finishes, never above the estimate you approve.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How to cancel</h2>
            <p>You can cancel your paid subscription at any time — no calls, no emails required:</p>
            <ol className="list-decimal list-inside space-y-2 text-zinc-400 mt-3">
              <li>Log in to your Flowfiy account</li>
              <li>Go to <strong className="text-zinc-300">Settings → Billing</strong></li>
              <li>Click <strong className="text-zinc-300">Cancel subscription</strong></li>
              <li>Confirm cancellation</li>
            </ol>
            <p className="mt-4">
              Your subscription will remain active until the end of your current paid billing period. After that, your account becomes inactive and lead generation pauses until you resubscribe. Your existing data is retained per our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Monthly plans</h2>
            <p>
              Monthly subscriptions are billed in advance at the start of each billing cycle. Cancellations take effect at the end of the current period.
            </p>
            <p className="mt-3">
              <strong className="text-zinc-200">We do not issue prorated refunds for unused days on monthly plans.</strong> If you cancel mid-month, you retain full access until your billing date and no refund is issued for the remaining days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Annual plans</h2>
            <p>
              If you are on an annual plan and request a cancellation within <strong className="text-zinc-200">7 days of your most recent annual charge</strong>, you are eligible for a full refund of that charge. Requests must be submitted to <span className="text-violet-400">support@flowfiy.com</span> with your account email and reason.
            </p>
            <p className="mt-3">
              After the 7-day window, annual plans follow the same no-prorated-refund policy as monthly plans. Your access continues until the annual period ends.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Exceptions — when we do issue refunds</h2>
            <p>We will issue a refund outside of the standard policy in the following situations:</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 mt-3">
              <li><strong className="text-zinc-300">Duplicate charge:</strong> You were charged more than once for the same period due to a payment processing error</li>
              <li><strong className="text-zinc-300">Extended service outage:</strong> Flowfiy experienced a verified outage of more than 72 consecutive hours affecting your account</li>
              <li><strong className="text-zinc-300">Unauthorized charge:</strong> A charge was made after you cancelled and we can confirm the cancellation was processed before the charge date</li>
            </ul>
            <p className="mt-4">
              To request an exception-based refund, email <span className="text-violet-400">support@flowfiy.com</span> within 14 days of the charge. Include your account email, the charge date, and a brief description of the issue. We respond within 2 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Plan downgrades</h2>
            <p>
              You can downgrade your plan at any time from Settings → Billing. The downgrade takes effect at the start of your next billing cycle. There is no refund for the difference in price for the current period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Account termination by Flowfiy</h2>
            <p>
              If we terminate your account for a violation of our <Link href="/terms" className="text-violet-400 hover:text-violet-300">Terms of Service</Link>, no refund will be issued. If we terminate your account for any other reason (e.g., business closure), we will issue a prorated refund for the unused portion of your current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. What happens to your data after cancellation</h2>
            <p>
              When your subscription ends or your account is fully closed:
            </p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 mt-3">
              <li>Your lead lists, outreach copy, and campaign data are retained while your account exists, so they are available again if you resubscribe</li>
              <li>Your connected Gmail account is retained but can be disconnected at any time from Settings → Integrations</li>
              <li>If you request full account deletion, all your data is permanently deleted within 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Credits — consumption, expiry and refunds</h2>
            <p>
              Credits are charged when a search completes, based on the actual qualified leads delivered. Once consumed, credits are non-refundable — including searches that produced fewer qualified leads than the estimate suggested, since AI research quality is not a basis for a refund. A search that returns no qualified leads is never charged, and any reserved credits are released back to your balance automatically.
            </p>
            <p className="mt-3">
              Plan credits roll over once into the next billing cycle and then expire 60 days after they were issued. Purchased top-up credits follow the same 60-day expiry. Expired credits are not refundable or reinstatable.
            </p>
            <p className="mt-3">
              If a search fails due to a confirmed Flowfiy platform error (not a third-party provider outage), any credits it consumed will be restored to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact for refund requests</h2>
            <p>
              For all refund requests or billing questions, email <span className="text-violet-400">support@flowfiy.com</span>. Please include your registered email address and the charge date. We aim to respond within 2 business days.
            </p>
          </section>

        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

        <div className="flex gap-6">
          <Link href="/terms" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service →</Link>
          <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy →</Link>
          <Link href="/contact" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Contact Us →</Link>
        </div>
      </div>
    </div>
  );
}
