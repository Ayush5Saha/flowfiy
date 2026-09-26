"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Phone, Plus } from "lucide-react";
import { EASE } from "@/components/landing/v2/motion";
import { Reveal, Section, SectionHeader } from "./ui";
import { CONTACT, FAQS, FAQ_HEADER } from "./content";

export function FAQ() {
  const [openItems, setOpenItems] = useState<ReadonlySet<number>>(new Set([0]));
  const baseId = useId();
  const firstFounder = CONTACT.founders[0];

  function toggle(i: number) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <Section id="faq" tone="white">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <SectionHeader eyebrow={FAQ_HEADER.eyebrow} title={FAQ_HEADER.title} body={FAQ_HEADER.body} />
          <div className="mt-6 flex flex-col items-start gap-3">
            <a
              href={`tel:${firstFounder.phoneHref}`}
              className="inline-flex items-center gap-2 text-[15px] font-medium text-rc-teal-deep hover:text-rc-ink"
            >
              <Phone className="h-4 w-4" strokeWidth={1.75} />
              {firstFounder.phone}
            </a>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-rc-teal-deep hover:text-rc-ink"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              WhatsApp us
            </a>
          </div>
        </div>

        <div className="border-t border-rc-line lg:col-span-8">
          {FAQS.map((faq, i) => {
            const isOpen = openItems.has(i);
            const panelId = `${baseId}-panel-${i}`;
            const buttonId = `${baseId}-button-${i}`;
            return (
              <Reveal key={faq.q} delay={Math.min(i, 6) * 0.03} className="border-b border-rc-line">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                  className="flex w-full items-start justify-between gap-6 py-6 text-left text-[17px] font-medium text-rc-ink"
                >
                  {faq.q}
                  <Plus
                    className={`h-5 w-5 shrink-0 text-rc-muted transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                    strokeWidth={1.75}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-10 text-[15.5px] leading-[1.7] text-rc-body">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
