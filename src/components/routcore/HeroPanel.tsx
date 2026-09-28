"use client";

import { motion } from "framer-motion";
import { Check, FileText, FileCheck2, UserPlus, BellRing, CircleCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARD, SHADOW } from "./ui";
import { EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { EXAMPLE_DAY, type DayIcon } from "./content";

const ICONS: Record<DayIcon, LucideIcon> = {
  report: FileText,
  documents: FileCheck2,
  onboarding: UserPlus,
  reminder: BellRing,
};

/**
 * The hero's centrepiece: a mock "today" panel from a live Routcore system,
 * plus a WhatsApp exchange card. The chat card sits in NORMAL FLOW (pulled up
 * with a negative margin, pushed right with ml-auto), not absolutely
 * positioned, so the wrapper's height is automatic and never has to be
 * hand-tuned against the panel's content height. It overlaps only the
 * panel's footer strip, and only on the right, where the (single,
 * left-aligned) footer item leaves that space empty.
 */
export function HeroPanel() {
  const reduced = useReducedMotionSafe();

  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:mr-0">
      <motion.div
        className={`${CARD} ${SHADOW} overflow-hidden`}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
      >
        <div className="flex items-center justify-between border-b border-rc-line px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold text-rc-ink">{EXAMPLE_DAY.title}</p>
            <p className="text-[12px] text-rc-muted">{EXAMPLE_DAY.caption}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rc-teal-soft px-2.5 py-1 text-[12px] font-medium text-rc-teal-deep">
            <span className="relative flex h-1.5 w-1.5">
              {!reduced && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rc-teal opacity-75" />
              )}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rc-teal" />
            </span>
            {EXAMPLE_DAY.status}
          </span>
        </div>

        <div className="divide-y divide-rc-line">
          {EXAMPLE_DAY.events.map((event, i) => {
            const Icon = ICONS[event.icon];
            return (
              <motion.div
                key={event.title}
                className="flex gap-3.5 px-5 py-3.5"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.07, ease: EASE }}
              >
                <span className="w-[64px] shrink-0 pt-0.5 text-[12px] tabular-nums text-rc-muted">
                  {event.time}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-rc-line bg-rc-bg">
                  <Icon className="h-4 w-4 text-rc-teal" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-rc-ink">{event.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-rc-muted">{event.detail}</p>
                </div>
                <span className="ml-auto hidden shrink-0 self-start rounded-md border border-rc-line bg-white px-1.5 py-0.5 text-[11px] font-medium text-rc-body sm:block">
                  {event.channel}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center border-t border-rc-line bg-rc-bg/60 px-5 py-3 text-[12px] text-rc-body">
          {EXAMPLE_DAY.footer.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-rc-teal" strokeWidth={2} />
              {item}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        className={`relative z-10 -mt-11 ml-auto hidden w-[300px] translate-x-3 sm:block lg:translate-x-7 ${CARD} ${SHADOW} p-4`}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: EASE }}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[13px] font-semibold text-[#128C4B]">
            {EXAMPLE_DAY.chat.initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-rc-ink">{EXAMPLE_DAY.chat.name}</p>
            <p className="text-[11.5px] text-rc-muted">{EXAMPLE_DAY.chat.context}</p>
          </div>
          <span className="shrink-0 text-[11px] text-rc-muted">{EXAMPLE_DAY.chat.time}</span>
        </div>

        <div className="mt-3 space-y-1.5 text-[12px] leading-snug">
          {EXAMPLE_DAY.chat.messages.map((m, i) => (
            <p
              key={i}
              className={
                m.from === "them"
                  ? "max-w-[85%] rounded-2xl rounded-tl-sm bg-rc-bg px-3 py-1.5 text-rc-ink"
                  : "ml-auto max-w-[88%] rounded-2xl rounded-tr-sm bg-rc-teal-soft px-3 py-1.5 text-rc-ink"
              }
            >
              {m.text}
            </p>
          ))}
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-rc-teal-deep">
          <CircleCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
          {EXAMPLE_DAY.chat.outcome}
        </p>
      </motion.div>
    </div>
  );
}
