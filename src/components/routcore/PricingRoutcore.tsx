"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Phone, Linkedin, MessageCircle } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { TiltCard } from "./TiltCard";
import { TIERS, PLAN_INCLUDES, VOICE_RATE } from "./content";
import { useRegion } from "./useRegion";

const CHANNEL_ICON = {
  Email: Mail,
  Voice: Phone,
  LinkedIn: Linkedin,
  WhatsApp: MessageCircle,
} as const;

export function PricingRoutcore() {
  const { region, setRegion, resolved } = useRegion();
  const voice = VOICE_RATE[region];

  return (
    <section id="pricing" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.13),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Investment</Eyebrow>
            <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
              <MaskReveal>Pick your channels.</MaskReveal>
              <MaskReveal delay={0.08}>
                <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                  One build fee, one retainer.
                </span>
              </MaskReveal>
            </h2>
            <MaskReveal delay={0.18}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
                The build fee gets your engine live in your own environment. The
                monthly retainer keeps it running, monitored and improving. No
                per-send or per-lead software fees on top.
              </p>
            </MaskReveal>
          </div>

          {/* Region override — IP geo is wrong often enough (VPNs, travel) that
              the visitor needs a way to reach the other region's prices. */}
          <div
            role="group"
            aria-label="Choose pricing region"
            className="inline-flex shrink-0 self-start rounded-full border border-white/10 bg-white/[0.03] p-1 lg:self-auto"
          >
            {([
              ["IN", "🇮🇳", "India"],
              ["INTL", "🌍", "International"],
            ] as const).map(([key, flag, label]) => (
              <button
                key={key}
                onClick={() => setRegion(key)}
                aria-pressed={region === key}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                  region === key
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span aria-hidden>{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => {
            const price = t.price[region];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.7, delay: i * 0.09, ease: EASE }}
              >
                <TiltCard className="h-full" max={5}>
                  <div
                    className={`flex h-full flex-col p-7 sm:p-8 ${
                      t.highlight
                        ? "bg-gradient-to-br from-indigo-600/12 via-transparent to-violet-600/10"
                        : ""
                    }`}
                  >
                    {t.highlight && (
                      <span className="mb-5 inline-flex w-fit rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-violet-200">
                        Most popular
                      </span>
                    )}

                    {/* Channel icons — the tier's real differentiator */}
                    <div className="flex items-center gap-2">
                      {t.channels.map((c) => {
                        const Icon = CHANNEL_ICON[c];
                        return (
                          <span
                            key={c}
                            title={c}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
                          >
                            <Icon className="h-3.5 w-3.5 text-violet-300" />
                          </span>
                        );
                      })}
                    </div>

                    <h3 className="mt-5 text-lg font-semibold leading-snug tracking-[-0.01em] text-white">
                      {t.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.tagline}</p>

                    <div className="mt-7">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Setup &amp; build
                      </p>
                      {/* Held back until geo resolves — a price that visibly
                          changes currency under the reader looks like a bug. */}
                      <p
                        className={`mt-2 text-[clamp(1.75rem,3vw,2.4rem)] font-black leading-none tracking-[-0.03em] text-white transition-opacity duration-300 ${
                          resolved ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {price.setup}
                        <span className="ml-1.5 text-sm font-normal text-zinc-500">one-time</span>
                      </p>
                    </div>

                    <div className="mt-6 border-t border-white/8 pt-6">
                      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        Retainer
                      </p>
                      <p
                        className={`mt-2 text-[clamp(1.35rem,2.2vw,1.75rem)] font-bold leading-none tracking-[-0.02em] text-white transition-opacity duration-300 ${
                          resolved ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {price.retainer}
                        <span className="ml-1.5 text-sm font-normal text-zinc-500">/ month</span>
                      </p>
                    </div>

                    {t.hasVoice && (
                      <p
                        className={`mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-amber-200/80 transition-opacity duration-300 ${
                          resolved ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        + <span className="font-semibold">{voice.rate}</span> of voice
                        calling, billed separately on usage.
                      </p>
                    )}

                    <ul className="mt-7 flex-1 space-y-2.5">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[13px] text-zinc-400">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#contact"
                      className={`group mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                        t.highlight
                          ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-lg hover:shadow-violet-500/25"
                          : "border border-white/12 text-zinc-200 hover:border-white/25 hover:bg-white/5"
                      }`}
                    >
                      Request a quote
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        {/* Shared across every tier */}
        <motion.div
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Every tier includes
          </p>
          <ul className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_INCLUDES.map((inc) => (
              <li key={inc} className="flex items-start gap-2.5 text-sm text-zinc-400">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                {inc}
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-white/8 pt-5 text-sm leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-300">What the fees do and don&apos;t cover.</span>{" "}
            Final scope — inbox count, number of sequences, tool integrations and
            custom targeting logic — is confirmed on the discovery call, and you
            get a fixed quote before any work starts. Billing is 50% advance to
            reserve your slot and 50% on delivery, payable by UPI, bank transfer
            or card. The system has no per-send or per-lead software fees; you
            pay your own providers directly for domains and inboxes (e.g. Google
            Workspace) and for any third-party prospecting tools you connect,
            such as Apollo or Clay. {voice.note}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
