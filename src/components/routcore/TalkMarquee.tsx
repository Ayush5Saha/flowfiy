"use client";

/**
 * Giant closing marquee before the contact form — alternating solid/outlined
 * type, scrolling endlessly, pausing on hover. The real message is exposed to
 * assistive tech once via a plain (visually sr-only) heading; the scrolling
 * strip itself is decorative and hidden from the accessibility tree, since a
 * looping, duplicated marquee would otherwise read out forever.
 */

import { Marquee } from "./Marquee";

const PHRASES = [
  "FEELING STUCK? LET'S TALK.",
  "DOING IT BY HAND? LET'S TALK.",
  "READY TO SCALE? LET'S TALK.",
];

export function TalkMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#030305] py-10 sm:py-14">
      <h2 className="sr-only">
        Feeling stuck? Doing it by hand? Ready to scale? Let&apos;s talk.
      </h2>
      <div aria-hidden="true">
        <Marquee duration={26} pauseOnHover>
          {PHRASES.map((phrase, i) => (
            <span
              key={phrase}
              className={`mx-6 shrink-0 whitespace-nowrap font-black uppercase tracking-[-0.02em] text-[clamp(3rem,9vw,8rem)] ${
                i % 2 === 0
                  ? "bg-gradient-to-r from-cyan-300 via-indigo-400 to-violet-500 bg-clip-text text-transparent"
                  : "text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.35)]"
              }`}
            >
              {phrase}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
