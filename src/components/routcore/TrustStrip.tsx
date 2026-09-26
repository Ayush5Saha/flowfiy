import { Container } from "./ui";
import { INDUSTRIES, CHANNELS } from "./content";

export function TrustStrip() {
  return (
    <div className="border-y border-rc-line bg-white">
      <Container className="flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="flex flex-wrap items-center gap-2.5 text-[14px] text-rc-muted">
          <span>Trusted across</span>
          {INDUSTRIES.map((industry, i) => (
            <span key={industry} className="flex items-center gap-2.5">
              {i > 0 && <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-rc-faint" />}
              <span className="font-medium text-rc-ink">{industry}</span>
            </span>
          ))}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[13px] text-rc-muted">Runs on</span>
          {CHANNELS.map((channel) => (
            <span
              key={channel}
              className="rounded-full border border-rc-line px-3 py-1 text-[13px] text-rc-body"
            >
              {channel}
            </span>
          ))}
        </div>
      </Container>
    </div>
  );
}
