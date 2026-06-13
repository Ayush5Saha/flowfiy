"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  EASE,
  Eyebrow,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";

// ── Data ──────────────────────────────────────────────────────
const FEATURED = {
  quote:
    "The personalization is genuinely impressive — each email references something specific about the prospect's company. Our reply rate went from 3% to 18% in the first month.",
  name: "Sarah Chen",
  role: "VP Engineering, Streamline Labs",
  initial: "S",
  gradientFrom: "#6366F1",
  gradientTo: "#8B5CF6",
};

const SUPPORTING = [
  {
    quote:
      "We went from 2 hours of manual research per lead to 90 seconds, fully automated. The qualification scoring alone saved us from chasing dead ends.",
    name: "Jordan Blake",
    role: "Head of Growth, CloudBridge",
    initial: "J",
    gradientFrom: "#8B5CF6",
    gradientTo: "#6366F1",
  },
  {
    quote:
      "Running outbound for 8 clients, the multi-tenant setup and team seats are exactly what we needed. Claude is managed by Flowfiy — no infra headaches.",
    name: "Marcus Rivera",
    role: "Founder, RevOps Agency",
    initial: "M",
    gradientFrom: "#6366F1",
    gradientTo: "#22D3EE",
  },
];

// ── Stars ─────────────────────────────────────────────────────
function Stars() {
  return (
    <span className="flex items-center gap-[3px]" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="#F59E0B"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 2l2.9 8.26H23l-7.1 5.15 2.71 8.26L12 18.52l-6.61 5.15 2.71-8.26L1 10.26h8.1z" />
        </svg>
      ))}
    </span>
  );
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({
  initial,
  from,
  to,
  size = "sm",
}: {
  initial: string;
  from: string;
  to: string;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <span
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

// ── Large quotation mark accent ────────────────────────────────
function QuoteMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="36"
      viewBox="0 0 48 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 36V22.08C0 14.4 2.56 8.48 7.68 4.32 12.8 1.44 18.56 0 24.96 0v5.76c-4.48.64-7.68 2.24-9.6 4.8-1.28 1.92-1.92 4.16-1.92 6.72h10.56V36H0zm26.88 0V22.08c0-7.68 2.56-13.6 7.68-17.76C39.68 1.44 45.44 0 51.84 0v5.76c-4.48.64-7.68 2.24-9.6 4.8-1.28 1.92-1.92 4.16-1.92 6.72H50.88V36H26.88z"
        fill="url(#qm-grad)"
        fillOpacity="0.18"
      />
      <defs>
        <linearGradient id="qm-grad" x1="0" y1="0" x2="51.84" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Supporting card ────────────────────────────────────────────
function SupportingCard({
  quote,
  name,
  role,
  initial,
  gradientFrom,
  gradientTo,
  delay,
}: (typeof SUPPORTING)[0] & { delay: number }) {
  const reduced = useReducedMotionSafe();

  return (
    <MaskReveal delay={delay}>
      <motion.div
        data-cursor
        className="group relative flex h-full flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
        whileHover={reduced ? {} : { y: -4, borderColor: "rgba(99,102,241,0.3)" }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        {/* Subtle indigo glow on hover */}
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 80%)",
          }}
          aria-hidden="true"
        />

        <Stars />

        <blockquote className="flex-1 text-[15px] leading-relaxed text-zinc-300">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Hairline divider */}
        <span className="block h-px w-full bg-white/[0.06]" aria-hidden="true" />

        <div className="flex items-center gap-3">
          <Avatar initial={initial} from={gradientFrom} to={gradientTo} size="sm" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-tight text-white">{name}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
              {role}
            </p>
          </div>
        </div>
      </motion.div>
    </MaskReveal>
  );
}

// ── Section ────────────────────────────────────────────────────
export function TestimonialsV2() {
  const reduced = useReducedMotionSafe();

  // Subtle parallax on the large quotation mark accent
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const qmY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-18, 18]);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#050508] py-[clamp(6rem,12vw,11rem)]"
    >
      {/* Very faint radial behind the featured card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 h-[600px] w-[700px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-6">
        {/* Header row — asymmetric: label + heading left, stat right */}
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-xl">
            <MaskReveal>
              <Eyebrow>REAL RESULTS</Eyebrow>
            </MaskReveal>
            <h2 className="mt-5 font-black leading-[0.97] tracking-[-0.03em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]">
              <MaskReveal delay={0.06}>Teams that stopped</MaskReveal>
              <MaskReveal delay={0.13}>
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  doing it by hand.
                </span>
              </MaskReveal>
            </h2>
          </div>

          {/* Right-anchored metric — cyan accent, data signal only */}
          <MaskReveal delay={0.18} className="shrink-0">
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="font-black tabular-nums leading-none tracking-[-0.03em] text-white text-[clamp(2.8rem,4vw,3.8rem)]">
                6×
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                avg reply-rate lift
              </span>
              <span className="mt-1 block h-px w-12 self-end bg-gradient-to-r from-cyan-400/60 to-transparent" />
            </div>
          </MaskReveal>
        </div>

        {/* Layout: featured left (2/3) + supporting stack right (1/3) */}
        <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_340px]">

          {/* ── Featured quote ─────────────────────────────── */}
          <MaskReveal delay={0.08}>
            <motion.div
              data-cursor
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm sm:p-10"
              whileHover={reduced ? {} : { y: -5, borderColor: "rgba(99,102,241,0.35)" }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* Hover glow */}
              <span
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 55% at 30% 0%, rgba(99,102,241,0.1) 0%, transparent 80%)",
                }}
                aria-hidden="true"
              />

              {/* Parallax quotation mark */}
              <motion.div
                className="pointer-events-none absolute right-8 top-6 select-none sm:right-10"
                style={{ y: qmY }}
                aria-hidden="true"
              >
                <QuoteMark />
              </motion.div>

              {/* Stars */}
              <Stars />

              {/* Quote body — larger, more weight */}
              <blockquote className="relative z-10 mt-6 flex-1 text-[clamp(1.05rem,2.2vw,1.35rem)] font-medium leading-[1.5] tracking-[-0.01em] text-zinc-200">
                &ldquo;{FEATURED.quote}&rdquo;
              </blockquote>

              {/* Inline stat callout — cyan signal accent */}
              <div className="relative z-10 mt-8 flex flex-wrap items-center gap-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Reply rate
                  </span>
                  <span className="font-black tabular-nums text-zinc-500 text-[clamp(1rem,1.8vw,1.2rem)] line-through decoration-zinc-600">
                    3%
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600">→</span>
                  <span className="font-black tabular-nums text-cyan-400 text-[clamp(1.1rem,2vw,1.4rem)]">
                    18%
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    Timeframe
                  </span>
                  <span className="font-semibold text-zinc-300 text-[13px]">
                    first month
                  </span>
                </div>
              </div>

              {/* Hairline */}
              <span className="relative z-10 mt-8 block h-px w-full bg-white/[0.07]" aria-hidden="true" />

              {/* Attribution */}
              <div className="relative z-10 mt-6 flex items-center gap-4">
                <Avatar
                  initial={FEATURED.initial}
                  from={FEATURED.gradientFrom}
                  to={FEATURED.gradientTo}
                  size="md"
                />
                <div>
                  <p className="font-semibold leading-tight text-white">{FEATURED.name}</p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                    {FEATURED.role}
                  </p>
                </div>
              </div>
            </motion.div>
          </MaskReveal>

          {/* ── Supporting stack ───────────────────────────── */}
          <div className="flex flex-col gap-4">
            {SUPPORTING.map((s, i) => (
              <SupportingCard key={s.name} {...s} delay={0.14 + i * 0.1} />
            ))}
          </div>
        </div>

        {/* Bottom mono index / decorative line */}
        <MaskReveal delay={0.3} className="mt-16">
          <div className="flex items-center gap-6">
            <span className="block h-px flex-1 bg-white/[0.05]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-700">
              05 — SOCIAL PROOF
            </span>
            <span className="block h-px w-12 bg-gradient-to-r from-indigo-500/40 to-transparent" />
          </div>
        </MaskReveal>
      </div>
    </section>
  );
}
