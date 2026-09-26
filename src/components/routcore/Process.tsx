import { Check } from "lucide-react";
import { ButtonLink, Eyebrow, Heading, Lead, Reveal, Section, SectionHeader, SHADOW } from "./ui";
import { CONSULTATION, PROCESS } from "./content";

// Varying placeholder-text bar widths per plan section so the document mock
// reads as real text rather than four identical grey bars.
const LINE_WIDTHS: ReadonlyArray<readonly [string, string]> = [
  ["92%", "68%"],
  ["85%", "60%"],
  ["95%", "72%"],
  ["80%", "55%"],
];

export function Process() {
  return (
    <Section id="process" tone="white">
      <SectionHeader eyebrow={PROCESS.eyebrow} title={PROCESS.title} />

      <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {PROCESS.steps.map((step, i) => (
          <Reveal key={step.n} delay={i * 0.05} className="relative border-t border-rc-line pt-7">
            <span
              aria-hidden="true"
              className="absolute -top-[5px] left-0 h-[9px] w-[9px] rounded-full border-2 border-rc-teal bg-white"
            />
            <p className="text-[13px] font-semibold tabular-nums text-rc-teal-deep">{step.n}</p>
            <p className="mt-3 text-[18px] font-semibold text-rc-ink">{step.title}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-rc-body">{step.body}</p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-20 overflow-hidden rounded-3xl bg-rc-ink">
        <div className="grid gap-12 p-8 sm:p-12 lg:grid-cols-12 lg:items-center lg:gap-16 lg:p-14">
          <div className="lg:col-span-6">
            <Eyebrow onDark>{CONSULTATION.eyebrow}</Eyebrow>
            <Heading as="h3" onDark className="mt-5 lg:text-[38px]">
              {CONSULTATION.title}
            </Heading>
            <Lead onDark className="mt-5">
              {CONSULTATION.body}
            </Lead>
            <ButtonLink href={CONSULTATION.cta.href} variant="onDark" arrow className="mt-8">
              {CONSULTATION.cta.label}
            </ButtonLink>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[420px]">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-2 translate-y-2 rounded-xl bg-white/10"
              />
              <div className={`relative rounded-xl bg-white p-7 ${SHADOW}`}>
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-rc-muted">
                  {CONSULTATION.plan.label}
                </p>
                <p className="mt-1 text-[18px] font-semibold text-rc-ink">
                  {CONSULTATION.plan.preparedFor}
                </p>
                <div className="mt-5 border-t border-rc-line" />
                {CONSULTATION.plan.sections.map((section, i) => {
                  const [w1, w2] = LINE_WIDTHS[i % LINE_WIDTHS.length];
                  return (
                    <div key={section} className="mt-5">
                      <p className="text-[14px] font-semibold text-rc-ink">
                        {i + 1}. {section}
                      </p>
                      <div className="mt-2.5 h-2 rounded-full bg-rc-line" style={{ width: w1 }} />
                      <div className="mt-1.5 h-2 rounded-full bg-rc-line" style={{ width: w2 }} />
                    </div>
                  );
                })}
                <p className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-rc-teal-soft px-3 py-1 text-[12px] font-medium text-rc-teal-deep">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {CONSULTATION.plan.footnote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
