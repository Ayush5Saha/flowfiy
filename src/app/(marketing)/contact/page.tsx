"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Zap, Clock, ChevronDown } from "lucide-react";

const SUBJECTS = [
  "General question",
  "Sales / pricing",
  "Technical support",
  "Billing or refund",
  "Partnership or integration",
  "Report a bug",
  "Other",
];

const FAQS = [
  {
    q: "How does the BYOK model work?",
    a: "You bring your own Anthropic API key. Flowfiy uses it to run the AI pipeline on your behalf — we never pay for your AI usage and you're never charged per-token by us. Your key is stored encrypted (AES-256-GCM) and only used when you trigger a pipeline run.",
  },
  {
    q: "Which plan should I start with?",
    a: "Start with the Free tier — you get 50 lifetime lead generations at no cost. If you're generating leads regularly, the Starter plan ($49/mo, 500 generations) fits most solo operators and consultants.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing in one click. Your access continues until the end of your current billing period. See our Refund & Cancellation Policy for full details.",
  },
  {
    q: "Is my data shared between users?",
    a: "Never. Flowfiy uses row-level security (Supabase RLS) to fully isolate each organization's data. Your leads, research, and outreach copy are only visible to your team.",
  },
  {
    q: "What APIs do I need to connect?",
    a: "At minimum: a Claude API key (Anthropic) to run the AI pipeline. For lead discovery you'll also need Apollo.io. Apify is optional for website scraping, Gmail for sending outreach, and Calendly if you want booking links in your emails.",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Send via mailto as fallback — replace with email API when available
      const mailtoLink = `mailto:support@flowfiy.com?subject=${encodeURIComponent(`[${form.subject}] from ${form.name}`)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\nMessage:\n${form.message}`)}`;
      window.location.href = mailtoLink;
      setSent(true);
    } catch {
      setError("Something went wrong. Please email us directly at support@flowfiy.com");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-3 block">Get in touch</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">How can we help?</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            We typically respond within a few hours. For urgent issues, reach out directly.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          <a
            href="mailto:support@flowfiy.com"
            className="group p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
              <MessageSquare className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Support</p>
            <p className="text-xs text-zinc-500">support@flowfiy.com</p>
            <p className="text-xs text-zinc-600 mt-1">Technical help, bugs, account issues</p>
          </a>

          <a
            href="mailto:sales@flowfiy.com"
            className="group p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-violet-500/30 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Sales</p>
            <p className="text-xs text-zinc-500">sales@flowfiy.com</p>
            <p className="text-xs text-zinc-600 mt-1">Pricing, plans, agency deals</p>
          </a>

          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">Response time</p>
            <p className="text-xs text-zinc-500">Within 24 hours</p>
            <p className="text-xs text-zinc-600 mt-1">Mon – Fri, 9am – 6pm IST</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Contact form */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Send us a message</h2>

            {sent ? (
              <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">Your email client should have opened</p>
                <p className="text-zinc-400 text-sm">
                  If it didn&apos;t, email us directly at{" "}
                  <a href="mailto:support@flowfiy.com" className="text-violet-400 hover:underline">
                    support@flowfiy.com
                  </a>
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-zinc-900">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us what you need help with..."
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Opening email client..." : "Send message"}
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6">Frequently asked questions</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <p className="text-sm text-zinc-400">
                Looking for docs or guides?{" "}
                <Link href="/blog" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Check our blog →
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
