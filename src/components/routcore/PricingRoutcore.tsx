"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Mail, Phone, Linkedin, MessageCircle } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { TiltCard } from "./TiltCard";
import { TIERS, PLAN_INCLUDES } from "./content";

const CHANNEL_ICON = {
  Email: Mail,
  Voice: Phone,
  LinkedIn: Linkedin,
  WhatsApp: MessageCircle,
} as const;

export function PricingRoutcore() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.13),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Packages</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>Three tiers.</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                Pick your channels.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              Every tier is the same engine — the difference is how many channels
              it works. We quote a fixed price on the discovery call once we know
              your scope, and it&apos;s the same offering wherever you&apos;re based.
            </p>
          </MaskReveal>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => (
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

                  {/* Channel icons — with no prices on the card, the channel mix
                      is what distinguishes one tier from the next. */}
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

                  <h3 className="mt-5 text-2xl font-bold leading-none tracking-[-0.02em] text-white">
                    {t.name}
                  </h3>
                  <p className="mt-2.5 text-sm font-medium text-violet-300">
                    {t.channelLabel}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t.tagline}</p>

                  <div className="mt-6 border-t border-white/8 pt-6">
                    <ul className="space-y-2.5">
                      {t.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[13px] text-zinc-400">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {t.hasVoice && (
                    <p className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-amber-200/80">
                      Voice calling minutes are billed separately on actual usage.
                    </p>
                  )}

                  <div className="flex-1" />

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
          ))}
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
            <span className="font-medium text-zinc-300">How pricing works.</span>{" "}
            Final scope — inbox count, number of sequences, tool integrations and
            custom targeting logic — is confirmed on the discovery call, and you
            get a fixed quote before any work starts. The system has no per-send
            or per-lead software fees; you pay your own providers directly for
            domains and inboxes (e.g. Google Workspace), for any third-party
            prospecting tools you connect such as Apollo or Clay, and for voice
            minutes on the tiers that include the calling agent.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
