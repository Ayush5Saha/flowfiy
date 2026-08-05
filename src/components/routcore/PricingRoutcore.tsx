"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";
import { TiltCard } from "./TiltCard";
import { PLANS, PLAN_INCLUDES } from "./content";

export function PricingRoutcore() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.13),transparent_70%)] blur-2xl"
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="max-w-2xl">
          <Eyebrow>Investment</Eyebrow>
          <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,4vw,3.25rem)]">
            <MaskReveal>One build fee.</MaskReveal>
            <MaskReveal delay={0.08}>
              <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">
                One flat retainer.
              </span>
            </MaskReveal>
          </h2>
          <MaskReveal delay={0.18}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
              The build fee gets your engine live and deployed into your own
              environment. The monthly retainer keeps it running, monitored and
              improving. No per-send or per-lead software fees on top.
            </p>
          </MaskReveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.region}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
            >
              <TiltCard className="h-full" max={5}>
                <div
                  className={`flex h-full flex-col p-8 sm:p-10 ${
                    p.highlight
                      ? "bg-gradient-to-br from-indigo-600/12 via-transparent to-violet-600/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                      <span aria-hidden className="text-base">{p.flag}</span>
                      {p.region}
                    </span>
                  </div>

                  <div className="mt-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      Setup &amp; build
                    </p>
                    <p className="mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)] font-black leading-none tracking-[-0.03em] text-white">
                      {p.setup}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">{p.setupNote}</p>
                  </div>

                  <div className="mt-7 border-t border-white/8 pt-7">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      Retainer
                    </p>
                    <p className="mt-2 text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-none tracking-[-0.02em] text-white">
                      {p.retainer}
                      <span className="ml-1.5 text-sm font-normal text-zinc-500">/ month</span>
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">{p.retainerNote}</p>
                  </div>

                  <ul className="mt-8 flex-1 space-y-3">
                    {PLAN_INCLUDES.map((inc) => (
                      <li key={inc} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                        {inc}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contact"
                    className={`group mt-9 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all ${
                      p.highlight
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

        <motion.div
          className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-7"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-sm leading-relaxed text-zinc-500">
            <span className="font-medium text-zinc-300">What the fees do and don&apos;t cover.</span>{" "}
            The Indian build fee is a range because scope varies — inbox count,
            number of sequences, tool integrations and custom targeting logic.
            You get a fixed quote after the discovery call, before any work
            starts. Billing is 50% advance to reserve your slot and 50% on
            delivery, payable by UPI, bank transfer or card. The system itself
            has no per-send or per-lead software fees; you pay your own providers
            directly for domains and inboxes (e.g. Google Workspace) and for any
            third-party prospecting tools you connect, such as Apollo or Clay.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
