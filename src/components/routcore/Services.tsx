"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowDown, Plus, Minus } from "lucide-react";
import { CARD, CheckItem, Section, SectionHeader } from "./ui";
import { EASE } from "@/components/landing/v2/motion";
import { FLOW_LABELS, SERVICES } from "./content";

type Area = (typeof SERVICES.areas)[number];

function FlowStep({ area }: { area: Area }) {
  return (
    <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
      <div className="rounded-xl border border-rc-line bg-rc-bg/70 p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-rc-muted">
          {FLOW_LABELS.when}
        </p>
        <p className="mt-2 text-[14px] leading-snug text-rc-ink">{area.flow.when}</p>
      </div>
      <div className="flex items-center justify-center py-1 md:py-0">
        <ArrowRight className="hidden h-4 w-4 text-rc-faint md:block" strokeWidth={1.75} />
        <ArrowDown className="h-4 w-4 text-rc-faint md:hidden" strokeWidth={1.75} />
      </div>
      <div className="rounded-xl border border-rc-teal/30 bg-rc-teal-soft p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-rc-teal-deep">
          {FLOW_LABELS.does}
        </p>
        <p className="mt-2 text-[14px] leading-snug text-rc-ink">{area.flow.does}</p>
      </div>
      <div className="flex items-center justify-center py-1 md:py-0">
        <ArrowRight className="hidden h-4 w-4 text-rc-faint md:block" strokeWidth={1.75} />
        <ArrowDown className="h-4 w-4 text-rc-faint md:hidden" strokeWidth={1.75} />
      </div>
      <div className="rounded-xl border border-rc-line bg-rc-bg/70 p-4">
        <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-rc-muted">
          {FLOW_LABELS.result}
        </p>
        <p className="mt-2 text-[14px] leading-snug text-rc-ink">{area.flow.result}</p>
      </div>
    </div>
  );
}

function AreaBody({ area, showTitle = true }: { area: Area; showTitle?: boolean }) {
  return (
    <>
      {showTitle && (
        <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-rc-ink">{area.title}</h3>
      )}
      <p className={showTitle ? "mt-2 text-[16px] text-rc-body" : "text-[16px] text-rc-body"}>
        {area.summary}
      </p>
      <FlowStep area={area} />
      <p className="mt-8 text-[13px] font-semibold uppercase tracking-[0.08em] text-rc-muted">
        Example systems
      </p>
      <ul className="mt-4 grid gap-3 text-[15px] sm:grid-cols-2">
        {area.examples.map((example) => (
          <CheckItem key={example}>{example}</CheckItem>
        ))}
      </ul>
      <div className="mt-8 border-t border-rc-line pt-6">
        <a
          href="#contact"
          className="inline-flex items-center gap-2 text-[15px] font-medium text-rc-teal-deep transition-colors hover:text-rc-ink"
        >
          {SERVICES.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </a>
      </div>
    </>
  );
}

function DesktopTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = SERVICES.areas[activeIndex];

  function move(next: number) {
    const clamped = (next + SERVICES.areas.length) % SERVICES.areas.length;
    setActiveIndex(clamped);
    tabRefs.current[clamped]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(activeIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(activeIndex - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      move(0);
    } else if (e.key === "End") {
      e.preventDefault();
      move(SERVICES.areas.length - 1);
    }
  }

  return (
    <div className="mt-14 hidden gap-8 lg:grid lg:grid-cols-12">
      <div
        role="tablist"
        aria-orientation="vertical"
        className="space-y-1 lg:col-span-4"
        onKeyDown={onKeyDown}
      >
        {SERVICES.areas.map((area, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={area.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${area.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${area.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(i)}
              className={`relative flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left transition-colors ${
                isActive ? "bg-rc-bg" : "hover:bg-rc-bg/60"
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-rc-teal"
                />
              )}
              <span
                className={`text-[13px] tabular-nums ${isActive ? "text-rc-teal-deep" : "text-rc-faint"}`}
              >
                {area.n}
              </span>
              <span className={`text-[16px] font-medium ${isActive ? "text-rc-ink" : "text-rc-body"}`}>
                {area.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="lg:col-span-8">
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          className={`${CARD} overflow-hidden p-7 sm:p-9`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AreaBody area={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MobileAccordion() {
  const [openId, setOpenId] = useState<string>(SERVICES.areas[0].id);
  const baseId = useId();

  return (
    <div className="mt-10 lg:hidden">
      {SERVICES.areas.map((area) => {
        const isOpen = openId === area.id;
        return (
          <div key={area.id} className="border-b border-rc-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`${baseId}-acc-${area.id}`}
              onClick={() => setOpenId(isOpen ? "" : area.id)}
              className="flex w-full items-center gap-4 py-5 text-left"
            >
              <span className="text-[13px] tabular-nums text-rc-faint">{area.n}</span>
              <span className="flex-1 text-[16px] font-medium text-rc-ink">{area.title}</span>
              {isOpen ? (
                <Minus className="h-4 w-4 shrink-0 text-rc-muted" strokeWidth={1.75} />
              ) : (
                <Plus className="h-4 w-4 shrink-0 text-rc-muted" strokeWidth={1.75} />
              )}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${baseId}-acc-${area.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="pb-6">
                    <AreaBody area={area} showTitle={false} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function Services() {
  return (
    <Section id="services" tone="white">
      <SectionHeader
        layout="split"
        eyebrow={SERVICES.eyebrow}
        title={SERVICES.title}
        body={SERVICES.body}
      />
      <DesktopTabs />
      <MobileAccordion />
    </Section>
  );
}
