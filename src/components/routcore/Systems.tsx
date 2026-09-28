import { CARD, Section, SectionHeader } from "./ui";
import { SYSTEMS, SYSTEM_CATEGORIES, SYSTEMS_HEADER } from "./content";

export function Systems() {
  return (
    <Section id="systems" tone="tint">
      <SectionHeader
        layout="split"
        eyebrow={SYSTEMS_HEADER.eyebrow}
        title={SYSTEMS_HEADER.title}
        body={SYSTEMS_HEADER.body}
      />
      <div className="mt-14">
        {SYSTEM_CATEGORIES.map((category) => {
          const items = SYSTEMS.filter((system) => system.category === category);
          if (items.length === 0) return null;
          return (
            <div
              key={category}
              className="grid gap-6 border-t border-rc-line py-10 first:border-t-0 first:pt-0 lg:grid-cols-12 lg:gap-12"
            >
              <div className="lg:col-span-3">
                <p className="text-[16px] font-semibold text-rc-ink">{category}</p>
                <p className="mt-1.5 text-[13px] text-rc-muted">
                  {items.length} {items.length === 1 ? "system" : "systems"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3">
                {items.map((system) => (
                  <div
                    key={system.title}
                    className={`${CARD} p-6 transition-colors hover:border-rc-faint xl:p-5`}
                  >
                    <p className="text-[16px] font-semibold text-rc-ink">{system.title}</p>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-rc-body">{system.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
