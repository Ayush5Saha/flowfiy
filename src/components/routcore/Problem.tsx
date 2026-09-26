import { CARD, Reveal, Section, SectionHeader } from "./ui";
import { PROBLEM } from "./content";

export function Problem() {
  return (
    <Section id="problem" tone="tint">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <SectionHeader eyebrow={PROBLEM.eyebrow} title={PROBLEM.title} body={PROBLEM.body} />
        </div>
        <div className={`${CARD} divide-y divide-rc-line lg:col-span-7`}>
          {PROBLEM.rows.map((row, i) => (
            <Reveal key={row.title} delay={i * 0.04}>
              <div className="grid gap-1.5 px-6 py-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-8 sm:px-7 sm:py-6">
                <p className="text-[16px] font-semibold text-rc-ink">{row.title}</p>
                <p className="text-[15px] leading-relaxed text-rc-body">{row.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
