/**
 * Routcore wordmark: a small ink-square route mark plus the "Routcore" word.
 * `onDark` swaps text/mark fills for use on the ink header/footer bands.
 */
export function RoutcoreLogo({ onDark = false }: { onDark?: boolean }) {
  return (
    <a href="#top" aria-label="Routcore home" className="inline-flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect width="26" height="26" rx="7" className={onDark ? "fill-white/10" : "fill-rc-ink"} />
        <path
          d="M8 18 C8 12.5 12 9 18 9"
          className="stroke-white"
          strokeWidth={1.8}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="8" cy="18" r="2.2" className="fill-white" />
        <circle cx="18" cy="9" r="2.8" className="fill-rc-aqua" />
      </svg>
      <span
        className={`text-[17px] font-semibold tracking-[-0.02em] ${onDark ? "text-white" : "text-rc-ink"}`}
      >
        Routcore
      </span>
    </a>
  );
}
