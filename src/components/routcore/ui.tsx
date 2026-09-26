"use client";

/**
 * Routcore design-system primitives. Every section is built from these, so
 * spacing, type and colour stay consistent across the page.
 *
 * Palette: the `rc-*` Tailwind colours (tailwind.config.ts), taken from the
 * Routcore PDF. Navy ink for text and primary actions, teal as the single
 * accent, a pale blue-grey tint for alternating sections.
 */

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";

// ── Layout ─────────────────────────────────────────────────────

export function Container({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

type Tone = "white" | "tint" | "ink";

const TONE: Record<Tone, string> = {
  white: "bg-white",
  tint: "bg-rc-bg",
  ink: "bg-rc-ink",
};

/** A page section. `scroll-mt` keeps anchored headings clear of the sticky header. */
export function Section({
  id,
  tone = "white",
  className = "",
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-16 py-20 sm:py-24 lg:py-28 ${TONE[tone]} ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

// ── Type ───────────────────────────────────────────────────────

/** Small section label: a short teal rule, then uppercase text. */
export function Eyebrow({
  children,
  onDark = false,
  className = "",
}: {
  children: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.08em] ${
        onDark ? "text-rc-aqua" : "text-rc-teal-deep"
      } ${className}`}
    >
      <span aria-hidden className={`h-px w-5 ${onDark ? "bg-rc-aqua" : "bg-rc-teal"}`} />
      {children}
    </p>
  );
}

export function Heading({
  as: Tag = "h2",
  onDark = false,
  className = "",
  children,
}: {
  as?: "h1" | "h2" | "h3";
  onDark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag
      className={`text-balance text-[32px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[40px] lg:text-[44px] ${
        onDark ? "text-white" : "text-rc-ink"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Lead({
  onDark = false,
  className = "",
  children,
}: {
  onDark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={`text-[17px] leading-[1.7] ${onDark ? "text-white/70" : "text-rc-body"} ${className}`}
    >
      {children}
    </p>
  );
}

/**
 * Eyebrow + heading + optional lead.
 * `split`: heading on the left, lead bottom-aligned on the right (lg+).
 * `stack`: everything in one column, max ~720px wide.
 */
export function SectionHeader({
  eyebrow,
  title,
  body,
  layout = "stack",
  onDark = false,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  layout?: "stack" | "split";
  onDark?: boolean;
  className?: string;
}) {
  if (layout === "split") {
    return (
      <Reveal
        className={`grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-12 ${className}`}
      >
        <div className="lg:col-span-7">
          <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
          <Heading onDark={onDark} className="mt-5">
            {title}
          </Heading>
        </div>
        {body && (
          <Lead onDark={onDark} className="lg:col-span-5 lg:pb-1.5">
            {body}
          </Lead>
        )}
      </Reveal>
    );
  }
  return (
    <Reveal className={`max-w-[720px] ${className}`}>
      <Eyebrow onDark={onDark}>{eyebrow}</Eyebrow>
      <Heading onDark={onDark} className="mt-5">
        {title}
      </Heading>
      {body && (
        <Lead onDark={onDark} className="mt-5">
          {body}
        </Lead>
      )}
    </Reveal>
  );
}

// ── Actions ────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "onDark";
type ButtonSize = "md" | "sm";

// Height, padding and type size live in SIZE rather than BUTTON_BASE so a
// caller never has to override them with a competing class (h-10 vs h-12 is
// decided by stylesheet order, not by which class comes last).
const BUTTON_BASE =
  "group inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rc-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const SIZE: Record<ButtonSize, string> = {
  md: "h-12 px-6 text-[15px]",
  sm: "h-10 px-5 text-[14px]",
};

const BUTTON: Record<ButtonVariant, string> = {
  primary: "bg-rc-ink text-white hover:bg-rc-ink-2",
  secondary:
    "border border-rc-line bg-white text-rc-ink hover:border-rc-faint hover:bg-rc-bg",
  onDark: "bg-rc-aqua text-rc-ink hover:bg-white focus-visible:ring-offset-rc-ink",
};

/** Class string for a real <button> (e.g. the form submit). */
export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `${BUTTON_BASE} ${SIZE[size]} ${BUTTON[variant]}`;
}

/** An anchor styled as a button. In-page targets (#contact) use a plain <a>. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={`${buttonClass(variant, size)} ${className}`}>
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </a>
  );
}

// ── Surfaces & lists ───────────────────────────────────────────

/** Bordered white card. Add SHADOW only to the few "hero object" cards. */
export const CARD = "rounded-2xl border border-rc-line bg-white";

export const SHADOW =
  "shadow-[0_1px_2px_rgba(12,28,44,0.04),0_18px_44px_-22px_rgba(12,28,44,0.22)]";

export function CheckItem({
  onDark = false,
  children,
}: {
  onDark?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className={`mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full ${
          onDark ? "bg-rc-aqua/15 text-rc-aqua" : "bg-rc-teal-soft text-rc-teal-deep"
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={2.5} />
      </span>
      <span className={onDark ? "text-white/80" : "text-rc-body"}>{children}</span>
    </li>
  );
}

// ── Motion ─────────────────────────────────────────────────────

/**
 * The only scroll animation on the page: a short fade-up, once.
 * Reduced motion gets an opacity fade with no movement.
 */
export function Reveal({
  delay = 0,
  className = "",
  children,
}: {
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotionSafe();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
