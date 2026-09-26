"use client";

import { motion } from "framer-motion";
import { Container, ButtonLink } from "./ui";
import { EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { HERO } from "./content";
import { HeroPanel } from "./HeroPanel";

const STAGGER = 0.06;

export function Hero() {
  const reduced = useReducedMotionSafe();

  function fadeUp(i: number) {
    return {
      initial: reduced ? { opacity: 0 } : { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, delay: i * STAGGER, ease: EASE },
    };
  }

  return (
    <section id="top" className="relative overflow-hidden bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-b from-white to-rc-bg"
      />
      <Container className="relative grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-28 lg:pt-24">
        <div className="lg:col-span-6">
          <motion.span
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 rounded-full border border-rc-line bg-white px-3 py-1.5 text-[13px] font-medium text-rc-body"
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-rc-teal" />
            {HERO.badge}
          </motion.span>

          <motion.h1
            {...fadeUp(1)}
            className="mt-6 max-w-[600px] text-balance text-[40px] font-semibold leading-[1.06] tracking-[-0.035em] text-rc-ink sm:text-[52px] lg:text-[58px]"
          >
            {HERO.titleLead} <span className="text-rc-teal">{HERO.titleAccent}</span>
          </motion.h1>

          <motion.p
            {...fadeUp(2)}
            className="mt-6 max-w-[540px] text-[17px] leading-[1.7] text-rc-body sm:text-[18px]"
          >
            {HERO.body}
          </motion.p>

          <motion.div {...fadeUp(3)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href={HERO.primaryCta.href} arrow className="w-full sm:w-auto">
              {HERO.primaryCta.label}
            </ButtonLink>
            <ButtonLink href={HERO.secondaryCta.href} variant="secondary" className="w-full sm:w-auto">
              {HERO.secondaryCta.label}
            </ButtonLink>
          </motion.div>

          <motion.div
            {...fadeUp(4)}
            className="mt-12 grid max-w-[560px] grid-cols-3 gap-6 border-t border-rc-line pt-7"
          >
            {HERO.stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-[26px] font-semibold tracking-[-0.03em] text-rc-ink tabular-nums sm:text-[30px]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-rc-muted">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="lg:col-span-6">
          <HeroPanel />
        </div>
      </Container>
    </section>
  );
}
