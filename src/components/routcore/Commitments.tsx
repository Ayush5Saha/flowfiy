import { ShieldCheck } from "lucide-react";
import { CARD, Reveal, Section, SectionHeader } from "./ui";
import { CONTACT, COMMITMENTS } from "./content";

export function Commitments() {
  return (
    <Section id="commitments" tone="tint">
      <SectionHeader eyebrow={COMMITMENTS.eyebrow} title={COMMITMENTS.title} />

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <Reveal className={`${CARD} p-8`}>
          <p className="text-[18px] font-semibold text-rc-ink">{COMMITMENTS.needs.title}</p>
          <ol className="mt-6 space-y-4 text-[15px]">
            {COMMITMENTS.needs.items.map((item, i) => (
              <li key={item} className="flex gap-3.5">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-rc-line text-[12px] font-semibold text-rc-teal-deep">
                  {i + 1}
                </span>
                <span className="text-rc-body">{item}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={0.06} className={`${CARD} p-8`}>
          <p className="text-[18px] font-semibold text-rc-ink">{COMMITMENTS.promise.title}</p>
          {COMMITMENTS.promise.paragraphs.map((paragraph, i) => (
            <p
              key={paragraph}
              className={`mt-4 text-[15px] leading-relaxed ${
                i === 0 ? "font-medium text-rc-ink" : "text-rc-body"
              }`}
            >
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal
          delay={0.1}
          className={`${CARD} flex flex-col gap-5 p-8 sm:flex-row sm:items-start md:col-span-2`}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rc-teal-soft">
            <ShieldCheck className="h-[18px] w-[18px] text-rc-teal-deep" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[18px] font-semibold text-rc-ink">{COMMITMENTS.data.title}</p>
            <p className="mt-2 max-w-[780px] text-[15px] leading-relaxed text-rc-body">
              {COMMITMENTS.data.body}
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 flex flex-col gap-6 border-t border-rc-line pt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[18px] font-semibold text-rc-ink">{COMMITMENTS.foundersTitle}</p>
        <div className="flex flex-wrap items-center gap-6">
          {CONTACT.founders.map((founder) => (
            <div key={founder.name} className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rc-ink text-[14px] font-semibold text-white">
                {founder.initials}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-rc-ink">{founder.name}</p>
                <p className="text-[13px] text-rc-muted">
                  {founder.role} ·{" "}
                  <a href={`tel:${founder.phoneHref}`} className="hover:text-rc-ink">
                    {founder.phone}
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
