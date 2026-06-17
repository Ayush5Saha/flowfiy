"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { getLocalisedPrice } from "@/lib/currency";
import { EASE, Eyebrow, Lines, MaskReveal, useReducedMotionSafe } from "./motion";

// ── Plan (single managed plan — $50/mo for 400 credits) ─────────────
// priceInr ≈ $50/mo; getLocalisedPrice shows the local-currency equivalent.
const PLANS = [
  {
    name: "Flowfiy", priceInr: 4200, desc: "Everything you need to run outbound", gens: "400", seats: 1,
    features: [
      "About 600–800 qualified leads/mo",
      "Describe leads in plain English",
      "Condition-based targeting",
      "Research + 0–100 scoring on every lead",
      "Personalized emails + follow-ups",
      "Send from your own Gmail after review",
      "Fully managed AI & data — no API keys",
      "Top up extra credits anytime",
    ],
    cta: "Get started", highlight: true,
  },
];

export function PricingV2() {
  const reduced = useReducedMotionSafe();

  // ── Geo/currency logic — preserved EXACTLY from LandingPage.Pricing ──
  const [country, setCountry] = useState<string>("IN");
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => {
        if (d.country) setCountry(d.country);
      })
      .catch(() => null);
  }, []);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#050508] py-[clamp(6rem,12vw,11rem)]"
    >
      {/* Soft violet wash anchored top-right — sets the band apart without large fills */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-[42rem] w-[42rem] rounded-full opacity-[0.18] blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.55), rgba(99,102,241,0) 70%)",
        }}
      />
      {/* Top hairline — joins the section to the beat above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-[1320px] px-6">
        {/* ── Asymmetric header: label + headline left, sub anchored right ── */}
        <div className="mb-[clamp(3rem,6vw,5.5rem)] grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <MaskReveal>
              <Eyebrow>PRICING</Eyebrow>
            </MaskReveal>
            <h2 className="mt-7 font-black leading-[0.98] tracking-[-0.04em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]">
              <Lines text={"One plan.\nEverything included."} />
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pb-2">
            <MaskReveal delay={0.12}>
              <p className="max-w-md text-base leading-relaxed text-zinc-400 lg:ml-auto lg:text-right">
                400 credits a month — roughly 600–800 qualified leads. Need
                more? Top up credits anytime.
              </p>
            </MaskReveal>
          </div>
        </div>

        {/* ── Plan grid: stack → 2-col → 5-col row ── */}
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((plan, i) => {
            const lp = getLocalisedPrice(plan.priceInr, country);
            const showInrNote =
              plan.priceInr > 0 && lp.currency.code !== "INR";

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: reduced ? 0 : 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12% 0px -8% 0px" }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: EASE }}
                className={
                  plan.highlight
                    ? "sm:col-span-2 lg:col-span-1"
                    : undefined
                }
              >
                <PlanCard
                  plan={plan}
                  formatted={lp.formatted}
                  note={lp.note}
                  showInrNote={showInrNote}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── Closing reassurance line ── */}
        <MaskReveal delay={0.1} className="mt-12">
          <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-600">
            Pay only for qualified leads · Fully managed · Cancel anytime
          </p>
        </MaskReveal>
      </div>
    </section>
  );
}

// ── PlanCard ────────────────────────────────────────────────────────
// Restrained glass for standard plans; gradient-edged, softly glowing,
// slightly taller treatment for the highlighted "Growth" plan.

function PlanCard({
  plan,
  formatted,
  note,
  showInrNote,
}: {
  plan: (typeof PLANS)[number];
  formatted: string;
  note: string;
  showInrNote: boolean;
}) {
  const isContact = plan.cta === "Contact sales";
  const href = isContact ? "/contact" : "/signup";

  if (plan.highlight) {
    return (
      <div className="group relative h-full">
        {/* Soft violet glow behind the elevated card */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/40 via-indigo-500/20 to-transparent opacity-80 blur-[2px] transition-opacity duration-500 group-hover:opacity-100"
        />
        {/* Gradient hairline edge */}
        <div className="relative h-full rounded-3xl bg-gradient-to-b from-violet-500/60 via-indigo-500/30 to-white/10 p-px lg:-my-3">
          <div className="flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-[#0a0a12]/95 p-7 backdrop-blur-sm">
            {/* Most Popular pill */}
            <div className="absolute -top-3 left-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-gradient-to-r from-indigo-500/90 to-violet-500/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-500/30">
                <span className="h-1 w-1 rounded-full bg-cyan-300" />
                Most Popular
              </span>
            </div>

            <PlanHeader plan={plan} />
            <PlanPrice
              formatted={formatted}
              note={note}
              showInrNote={showInrNote}
              showPerMo={plan.priceInr > 0}
            />
            <PlanMeta plan={plan} highlight />
            <PlanFeatures plan={plan} highlight />

            <Link
              href={href}
              className="group/cta relative mt-auto inline-flex items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-50 blur-md transition-opacity duration-300 group-hover/cta:opacity-90" />
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
              <span className="relative z-10">{plan.cta}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard restrained glass card ──
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.05]">
      <PlanHeader plan={plan} />
      <PlanPrice
        formatted={formatted}
        note={note}
        showInrNote={showInrNote}
        showPerMo={plan.priceInr > 0}
      />
      <PlanMeta plan={plan} />
      <PlanFeatures plan={plan} />

      <Link
        href={href}
        className="mt-auto inline-flex items-center justify-center rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors duration-300 hover:border-white/25 hover:bg-white/5 hover:text-white"
      >
        {plan.cta}
      </Link>
    </div>
  );
}

// ── Sub-parts ───────────────────────────────────────────────────────

function PlanHeader({ plan }: { plan: (typeof PLANS)[number] }) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-base font-semibold tracking-tight text-white">
          {plan.name}
        </p>
        <span className="font-mono text-[10px] text-zinc-600">
          {String(PLANS.indexOf(plan) + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{plan.desc}</p>
      {/* Managed badge — hairline-pill v2 language */}
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-300/90">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Fully managed
      </span>
    </div>
  );
}

function PlanPrice({
  formatted,
  note,
  showInrNote,
  showPerMo,
}: {
  formatted: string;
  note: string;
  showInrNote: boolean;
  showPerMo: boolean;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-[clamp(2rem,2.4vw,2.6rem)] font-black tracking-[-0.03em] text-white">
          {formatted}
        </span>
        {showPerMo && (
          <span className="font-mono text-sm text-zinc-500">/mo</span>
        )}
      </div>
      {showInrNote && (
        <p className="mt-1.5 font-mono text-[11px] text-zinc-600">{note}</p>
      )}
    </div>
  );
}

function PlanMeta({
  plan,
  highlight = false,
}: {
  plan: (typeof PLANS)[number];
  highlight?: boolean;
}) {
  return (
    <div
      className={`mb-6 rounded-2xl border p-4 ${
        highlight
          ? "border-violet-400/15 bg-violet-500/[0.06]"
          : "border-white/8 bg-black/20"
      }`}
    >
      <p className="text-xs text-zinc-400">
        <span className="font-mono font-semibold text-white">{plan.gens}</span>{" "}
        credits
      </p>
      <p className="mt-1.5 text-xs text-zinc-400">
        <span className="font-mono font-semibold text-white">~2</span>{" "}
        leads per credit
      </p>
    </div>
  );
}

function PlanFeatures({
  plan,
  highlight = false,
}: {
  plan: (typeof PLANS)[number];
  highlight?: boolean;
}) {
  return (
    <ul className="mb-7 space-y-2.5">
      {plan.features.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-xs text-zinc-400">
          <Check
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
              highlight ? "text-violet-400" : "text-zinc-600"
            }`}
            strokeWidth={2.5}
          />
          <span className="leading-relaxed">{f}</span>
        </li>
      ))}
    </ul>
  );
}
