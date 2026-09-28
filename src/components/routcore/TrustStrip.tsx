import { Container } from "./ui";
import { TRUST } from "./content";

export function TrustStrip() {
  return (
    <div className="border-y border-rc-line bg-white">
      <Container className="flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="flex flex-wrap items-center gap-2.5 text-[14px] text-rc-muted">
          <span>{TRUST.functionsLabel}</span>
          {TRUST.functions.map((fn, i) => (
            <span key={fn} className="flex items-center gap-2.5">
              {i > 0 && <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-rc-faint" />}
              <span className="font-medium text-rc-ink">{fn}</span>
            </span>
          ))}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[13px] text-rc-muted">{TRUST.toolsLabel}</span>
          {TRUST.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-full border border-rc-line px-3 py-1 text-[13px] text-rc-body"
            >
              {tool}
            </span>
          ))}
        </div>
      </Container>
    </div>
  );
}
