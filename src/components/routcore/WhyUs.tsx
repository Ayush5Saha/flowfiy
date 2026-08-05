"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EASE, Eyebrow, MaskReveal } from "@/components/landing/v2/motion";

const REASONS = [
  {
    title: "Proven product, not theory",
    body: "Flowfiy is in production with real users and paying customers. Routcore applies the same engineering directly to your outbound.",
  },
  {
    title: "Built for scale and deliverability",
    body: "Multi-inbox architecture and automatic rotation aren't add-ons — they're how we build outbound systems in the first place.",
  },
  {
    title: "Hands-on and responsive",
    body: "You work directly with the founders building your system. No account-manager layer, no ticket queue.",
  },
];

export function WhyUs() {
  return (
    <section id="why-us" className="relative overflow-hidden bg-[#030305] py-28 scroll-mt-16 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 30%, rgba(99,102,241,0.10), transparent 42%), radial-gradient(circle at 85% 70%, rgba(139,92,246,0.10), transparent 45%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1320px] px-6 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>Who builds it</Eyebrow>
            <h2 className="mt-5 font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,3.6vw,3rem)]">
              <MaskReveal>The people who</MaskReveal>
              <MaskReveal delay={0.08}>
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  already shipped it.
                </span>
              </MaskReveal>
            </h2>
            <MaskReveal delay={0.18}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
                Routcore is built by{" "}
                <span className="font-medium text-zinc-200">Ayush Saha</span> and{" "}
                <span className="font-medium text-zinc-200">Yaswanth Alok</span>,
                co-founders of Flowfiy — a live AI-powered B2B outbound platform
                that runs an entire lead-generation pipeline through a sequence
                of AI agents: finding ideal customers, researching them, scoring
                them, and writing personalized outreach.
              </p>
            </MaskReveal>
            <MaskReveal delay={0.26}>
              <Link
                href="/founder"
                className="mt-7 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-200"
              >
                Meet the founders →
              </Link>
            </MaskReveal>
          </div>

          <ul className="space-y-4">
            {REASONS.map((r, i) => (
              <motion.li
                key={r.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors duration-300 hover:border-white/20 sm:p-8"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, delay: i * 0.09, ease: EASE }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <h3 className="text-lg font-semibold tracking-[-0.01em] text-white">
                  {r.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">{r.body}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
