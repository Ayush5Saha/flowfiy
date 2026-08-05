"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Phone, Clock } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { CONTACT } from "./content";

const REGIONS = ["India", "International"] as const;

const BUDGETS = [
  "₹45,000 – ₹80,000 (India)",
  "$2,500 (International)",
  "Not sure yet — advise me",
] as const;

const STEPS = [
  {
    n: "1",
    title: "Book a discovery call",
    body: "A short conversation to understand your goals, offer and current setup.",
  },
  {
    n: "2",
    title: "Lock your ICP & plan",
    body: "We define your ideal customer, messaging and inbox setup, and quote a fixed number.",
  },
  {
    n: "3",
    title: "Build & go live",
    body: "Your system is set up, tested and deployed in about two days.",
  },
];

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  region: REGIONS[0] as string,
  budget: BUDGETS[0] as string,
  message: "",
  company: "", // honeypot
};

export function RoutcoreContact() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/routcore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Something went wrong. Please email us directly at ${CONTACT.email}`);
        return;
      }
      setSent(true);
      setForm(EMPTY);
    } catch {
      setError(`Something went wrong. Please email us directly at ${CONTACT.email}`);
    } finally {
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40";
  const label = "mb-1.5 block text-[13px] font-medium text-zinc-300";

  return (
    <section id="contact" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">

          {/* Left — the pitch, the steps, the direct lines */}
          <div>
            <Eyebrow>Get started</Eyebrow>
            <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,3.8vw,3.25rem)]">
              <MaskReveal>Let&apos;s build your</MaskReveal>
              <MaskReveal delay={0.08}>
                <span className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                  always-on lead engine.
                </span>
              </MaskReveal>
            </h2>
            <MaskReveal delay={0.18}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
                Tell us about your offer and who you sell to. We&apos;ll come back
                with a fixed quote and a call slot that works for you.
              </p>
            </MaskReveal>

            <ol className="mt-12 space-y-6">
              {STEPS.map((s, i) => (
                <motion.li
                  key={s.n}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] font-mono text-[12px] font-semibold text-violet-300">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">{s.body}</p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <div className="mt-12 grid gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${CONTACT.email}`}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-violet-500/30 hover:bg-white/[0.06]"
              >
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                  <Mail className="h-4 w-4 text-violet-300" />
                </span>
                <p className="text-[13px] font-medium text-white">Email</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{CONTACT.email}</p>
              </a>

              <a
                href={`tel:${CONTACT.phoneHref}`}
                className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-violet-500/30 hover:bg-white/[0.06]"
              >
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                  <Phone className="h-4 w-4 text-violet-300" />
                </span>
                <p className="text-[13px] font-medium text-white">Phone</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{CONTACT.phone}</p>
              </a>
            </div>

            <p className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] text-zinc-600">
              <Clock className="h-3.5 w-3.5" />
              We reply within 24 hours · Mon–Fri, 9am–6pm IST
            </p>
          </div>

          {/* Right — the form */}
          <motion.div
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md sm:p-9"
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8%" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {sent ? (
              <div className="flex min-h-[26rem] flex-col items-center justify-center text-center">
                <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <Check className="h-7 w-7 text-emerald-400" />
                </span>
                <h3 className="text-xl font-semibold text-white">Request received</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Thanks — we&apos;ve got your details and will reply within 24
                  hours to set up the discovery call. If it&apos;s urgent, call{" "}
                  <a href={`tel:${CONTACT.phoneHref}`} className="text-violet-300 hover:underline">
                    {CONTACT.phone}
                  </a>
                  .
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot — hidden from humans, catches bots */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="absolute left-[-9999px] h-px w-px opacity-0"
                />

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label}>Full name</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label}>Work email</label>
                    <input
                      type="email"
                      required
                      maxLength={200}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className={field}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label}>Company</label>
                    <input
                      type="text"
                      maxLength={160}
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Acme Inc."
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label}>
                      Phone <span className="font-normal text-zinc-600">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={40}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 90000 00000"
                      className={field}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label}>Where are you based?</label>
                    <select
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                      className={field}
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r} className="bg-zinc-900">{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Budget range</label>
                    <select
                      value={form.budget}
                      onChange={(e) => setForm({ ...form, budget: e.target.value })}
                      className={field}
                    >
                      {BUDGETS.map((b) => (
                        <option key={b} value={b} className="bg-zinc-900">{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={label}>What do you sell, and who to?</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="We sell HR software to 50–500 person companies in the UK. Right now two SDRs do outbound manually and replies are scattered across four inboxes…"
                    className={`${field} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-45 blur-lg transition-opacity duration-300 group-hover:opacity-85" />
                  <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
                  <span className="relative z-10 inline-flex items-center gap-2">
                    {loading ? "Sending…" : "Request a quote"}
                    {!loading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </button>

                <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                  No payment is taken here. We&apos;ll reply with a fixed quote
                  and a call slot — 50% advance only once you decide to go ahead.
                </p>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
