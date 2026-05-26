"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Link2, DollarSign, CheckCircle2, Users, RefreshCw } from "lucide-react";
import type { Metadata } from "next";

const COMMISSION_RATE = 30;

const earningsTable = [
  { referrals: 5, plan: "Starter (₹4,900)", monthly: "₹7,350" },
  { referrals: 10, plan: "Starter (₹4,900)", monthly: "₹14,700" },
  { referrals: 5, plan: "Growth (₹9,900)", monthly: "₹14,850" },
  { referrals: 10, plan: "Growth (₹9,900)", monthly: "₹29,700" },
];

const steps = [
  { icon: Link2, title: "Share your link", desc: "You get a unique referral link (e.g. flowfiy.com?ref=YOURCODE). Share it anywhere — YouTube, Instagram, LinkedIn, email." },
  { icon: Users, title: "They subscribe", desc: "When someone clicks your link and subscribes to any paid Flowfiy plan, we record the conversion automatically." },
  { icon: RefreshCw, title: "You earn every month", desc: `You get ${COMMISSION_RATE}% of every payment they make — not just the first one. As long as they're subscribed, you earn.` },
];

const faqs = [
  { q: "When do I get paid?", a: "Commissions are paid out monthly via UPI. Minimum payout is ₹500." },
  { q: "Do I earn on renewals?", a: `Yes — ${COMMISSION_RATE}% on every subscription renewal, forever. Not just the first payment.` },
  { q: "How long does tracking last?", a: "30 days. If someone clicks your link and subscribes within 30 days, you earn the commission." },
  { q: "Is there a minimum audience size?", a: "No. We care about quality referrals, not follower count. Solo consultants and micro-creators are welcome." },
  { q: "How do I receive payouts?", a: "Add your UPI ID in your affiliate dashboard. We transfer directly to your UPI every month." },
];

export default function AffiliatesPage() {
  const [form, setForm] = useState({ name: "", email: "", website: "", socialHandle: "", audienceDescription: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/affiliate/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Affiliate Program
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Earn{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {COMMISSION_RATE}% recurring
            </span>{" "}
            for every customer you send us
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Flowfiy is <span className="text-white font-medium">your AI sales team</span> — and now you can earn by sharing it. When someone subscribes through your link, you get {COMMISSION_RATE}% of their payment every single month, not just the first one.
          </p>
          <a href="#apply" className="inline-flex items-center gap-2 px-7 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/25">
            Apply to join <ArrowRight className="w-4 h-4" />
          </a>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free to join</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No minimum audience</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Monthly UPI payouts</span>
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="bg-zinc-900/50 border border-white/6 rounded-2xl p-7">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-xs font-mono text-violet-400 mt-3">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Earnings table ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-2xl font-bold text-white">What you could earn</h2>
          </div>
          <p className="text-zinc-400 mb-10">Example monthly earnings at {COMMISSION_RATE}% commission</p>
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-white/8">
                  <th className="text-left px-5 py-3 text-zinc-400 font-medium">Referrals</th>
                  <th className="text-left px-5 py-3 text-zinc-400 font-medium">Plan</th>
                  <th className="text-right px-5 py-3 text-zinc-400 font-medium">Your earnings / mo</th>
                </tr>
              </thead>
              <tbody>
                {earningsTable.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 text-white font-medium">{row.referrals} customers</td>
                    <td className="px-5 py-3.5 text-zinc-400">{row.plan}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-400">{row.monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-600 mt-4">* Earnings recur monthly as long as customers stay subscribed.</p>
        </div>
      </section>

      {/* ── Apply form ────────────────────────────────────────────────────── */}
      <section id="apply" className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Apply to join</h2>
            <p className="text-zinc-400">We review every application within 48 hours and email you once approved.</p>
          </div>

          {submitted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Application received!</h3>
              <p className="text-zinc-400">We&apos;ll review your application and email you at <strong className="text-white">{form.email}</strong> within 48 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Full name *</label>
                  <input
                    required
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Email *</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Website / YouTube / LinkedIn</label>
                  <input
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition"
                    placeholder="https://..."
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Instagram / Twitter handle</label>
                  <input
                    className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition"
                    placeholder="@yourhandle"
                    value={form.socialHandle}
                    onChange={(e) => setForm({ ...form, socialHandle: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Tell us about your audience *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition resize-none"
                  placeholder="Who is your audience? (e.g. 'I run a YouTube channel for B2B founders with 8k subscribers focused on sales and growth')"
                  value={form.audienceDescription}
                  onChange={(e) => setForm({ ...form, audienceDescription: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {submitting ? "Submitting…" : <>Submit application <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-zinc-900/50 border border-white/6 rounded-xl p-5">
                <p className="font-medium text-white mb-2">{q}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-500 text-sm mt-10">
            Already an affiliate?{" "}
            <Link href="/affiliate/dashboard" className="text-violet-400 hover:text-violet-300 transition">
              Go to your dashboard →
            </Link>
          </p>
        </div>
      </section>

    </div>
  );
}
