import type { ReactNode } from "react";
import { Check, Minus, Users } from "lucide-react";
import { CARD, CheckItem, Reveal, Section, SectionHeader } from "./ui";
import { SCOPING } from "./content";

function DashItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full border border-rc-line bg-rc-bg"
      >
        <Minus className="h-3 w-3 text-rc-faint" strokeWidth={2.5} />
      </span>
      <span className="text-rc-body">{children}</span>
    </li>
  );
}

export function Scoping() {
  return (
    <Section id="scoping" tone="tint">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionHeader eyebrow={SCOPING.eyebrow} title={SCOPING.title} body={SCOPING.body} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <Reveal className={`${CARD} p-7`}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rc-teal-soft">
                <Check className="h-4 w-4 text-rc-teal-deep" strokeWidth={2} />
              </span>
              <p className="text-[18px] font-semibold text-rc-ink">{SCOPING.automate.title}</p>
            </div>
            <ul className="mt-6 space-y-3.5 text-[15px]">
              {SCOPING.automate.points.map((point) => (
                <CheckItem key={point}>{point}</CheckItem>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.06} className={`${CARD} p-7`}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rc-line bg-rc-bg">
                <Users className="h-4 w-4 text-rc-muted" strokeWidth={1.75} />
              </span>
              <p className="text-[18px] font-semibold text-rc-ink">{SCOPING.keep.title}</p>
            </div>
            <ul className="mt-6 space-y-3.5 text-[15px]">
              {SCOPING.keep.points.map((point) => (
                <DashItem key={point}>{point}</DashItem>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
