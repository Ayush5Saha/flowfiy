import { Check, Minus } from "lucide-react";
import { CARD, Section, SectionHeader } from "./ui";
import { COMPARISON } from "./content";

/**
 * Each of the 3 cells carries its own horizontal padding (not the row), so
 * the "With Routcore" cell's teal band can run flush to the card's rounded,
 * overflow-hidden right edge. The header repeats the same icons the data
 * rows use, at the same padding, so its labels line up with the text below
 * them instead of just guessing at the right offset.
 */
export function Comparison() {
  return (
    <Section id="outcomes" tone="white">
      <SectionHeader eyebrow={COMPARISON.eyebrow} title={COMPARISON.title} body={COMPARISON.body} />
      <div className={`mt-12 ${CARD} overflow-hidden`}>
        <div className="hidden grid-cols-[1fr_1.15fr_1.15fr] border-b border-rc-line bg-rc-bg text-[13px] font-semibold uppercase tracking-[0.08em] md:grid">
          <span className="px-6 py-4" />
          <span className="flex items-center gap-2.5 px-6 py-4 text-rc-muted">
            <Minus className="h-4 w-4 shrink-0 text-rc-faint" strokeWidth={1.75} />
            {COMPARISON.columns.before}
          </span>
          <span className="flex items-center gap-2.5 bg-rc-teal-soft/50 px-6 py-4 text-rc-teal-deep">
            <Check className="h-4 w-4 shrink-0 text-rc-teal" strokeWidth={1.75} />
            {COMPARISON.columns.after}
          </span>
        </div>

        {COMPARISON.rows.map((row, i) => (
          <div
            key={row.topic}
            className={`grid gap-2 px-6 py-5 md:grid-cols-[1fr_1.15fr_1.15fr] md:items-stretch md:gap-0 md:px-0 md:py-0 ${
              i < COMPARISON.rows.length - 1 ? "border-b border-rc-line" : ""
            }`}
          >
            <p className="text-[15px] font-semibold text-rc-ink md:flex md:items-center md:px-6 md:py-5">
              {row.topic}
            </p>

            <div className="flex items-start gap-2.5 text-[15px] text-rc-muted md:items-center md:px-6 md:py-5">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-rc-faint md:mt-0" strokeWidth={1.75} />
              <span>
                <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-rc-faint md:hidden">
                  {COMPARISON.columns.before}:
                </span>
                {row.before}
              </span>
            </div>

            <div className="flex items-start gap-2.5 text-[15px] text-rc-ink md:items-center md:bg-rc-teal-soft/50 md:px-6 md:py-5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-rc-teal md:mt-0" strokeWidth={1.75} />
              <span>
                <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-rc-teal-deep md:hidden">
                  {COMPARISON.columns.after}:
                </span>
                {row.after}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
