"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, MessageCircle, Phone } from "lucide-react";
import { EASE, MaskReveal } from "@/components/landing/v2/motion";
import { Pill } from "./Pill";
import { CONTACT, FOCUS_OPTIONS } from "./content";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  packageTier: FOCUS_OPTIONS[0] as string,
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
  const firstFounder = CONTACT.founders[0];

  return (
    <section id="contact" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)] blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          {/* Left — the pitch and the direct lines */}
          <div>
            <Pill>Get started</Pill>
            <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,3.8vw,3.25rem)]">
              <MaskReveal>Let&apos;s build</MaskReveal>
              <MaskReveal delay={0.08}>
                <span className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
                  your system.
                </span>
              </MaskReveal>
            </h2>
            <MaskReveal delay={0.18}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
                Tell us how your business runs today and where your team&apos;s
                time goes. We&apos;ll tell you honestly what&apos;s worth
                automating.
              </p>
            </MaskReveal>

            <div className="mt-10 space-y-3">
              {CONTACT.founders.map((f, i) => (
                <motion.a
                  key={f.name}
                  href={`tel:${f.phoneHref}`}
                  className="group flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-violet-500/30 hover:bg-white/[0.06]"
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                    <Phone className="h-4 w-4 text-violet-300" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-white">{f.name}</p>
                    <p className="text-[13px] text-zinc-500">{f.phone}</p>
                  </div>
                </motion.a>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
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
                  href={CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-violet-500/30 hover:bg-white/[0.06]"
                >
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 transition-colors group-hover:bg-violet-500/20">
                    <MessageCircle className="h-4 w-4 text-violet-300" />
                  </span>
                  <p className="text-[13px] font-medium text-white">WhatsApp</p>
                  <p className="mt-0.5 text-[13px] text-zinc-500">Message us directly</p>
                </a>
              </div>
            </div>
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
                  hours to set up your consultation call. If it&apos;s urgent,
                  call{" "}
                  <a href={`tel:${firstFounder.phoneHref}`} className="text-violet-300 hover:underline">
                    {firstFounder.phone}
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

                <div>
                  <label className={label}>What do you want to automate first?</label>
                  <select
                    value={form.packageTier}
                    onChange={(e) => setForm({ ...form, packageTier: e.target.value })}
                    className={field}
                  >
                    {FOCUS_OPTIONS.map((t) => (
                      <option key={t} value={t} className="bg-zinc-900">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={label}>What&apos;s repetitive in your business?</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="What does your team do over and over every day?"
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
                    {loading ? "Sending…" : "Book my consultation call"}
                    {!loading && (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </button>

                <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                  We&apos;ll reply within 24 hours to set up your consultation
                  call. No spam, no obligation.
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
