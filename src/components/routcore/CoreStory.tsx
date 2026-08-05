"use client";

/**
 * The scroll centrepiece: a sticky viewport where the camera orbits the core
 * and one more orbital ring docks onto it per stage. Scroll progress is piped
 * straight into the WebGL uniforms through a ref, so the camera moves at frame
 * rate without React re-rendering; only the active panel index is state.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { Check } from "lucide-react";
import { Eyebrow, EASE, useReducedMotionSafe } from "@/components/landing/v2/motion";
import { CoreCanvas, type CoreState } from "./CoreCanvas";
import { STAGES } from "./content";

export function CoreStory() {
  const ref = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CoreState>({ stage: 0.6, scroll: 0 });
  const [active, setActive] = useState(0);
  const reduced = useReducedMotionSafe();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Subscribing with `.on("change")` inside an effect — the same pattern the
  // main landing page's StoryScroll uses, kept identical so both scroll
  // stories behave the same way under the framer-motion version pinned here.
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (p) => {
      // Ring i docks while panel i is on screen, so the first ring is already
      // partly there at p = 0 rather than the core sitting bare.
      stateRef.current.stage = 0.6 + p * 5;
      stateRef.current.scroll = p;

      const i = Math.min(STAGES.length - 1, Math.max(0, Math.floor(p * STAGES.length)));
      setActive((prev) => (prev === i ? prev : i));
    });
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <section id="how-it-works" className="relative scroll-mt-16">
      <div ref={ref} className="relative h-[500vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#030305]">
          <CoreCanvas stateRef={stateRef} className="absolute inset-0" />

          {/* Scrims — keep the right-hand copy legible over the core */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_28%_50%,transparent,rgba(3,3,5,0.55)_70%)]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030305] via-transparent to-[#030305]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-full bg-gradient-to-l from-[#030305]/85 via-[#030305]/45 to-transparent lg:w-3/5" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-[1320px] items-center px-6 sm:px-8">
            <div className="grid w-full items-center gap-10 lg:grid-cols-2">
              {/* Left rail — section title + stage ticks */}
              <div className="hidden lg:block">
                <Eyebrow>How Routcore works</Eyebrow>
                <h2 className="mt-5 max-w-md font-black leading-[1.03] tracking-[-0.035em] text-white text-[clamp(2rem,3.4vw,3rem)]">
                  Five layers.
                  <br />
                  <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                    One engine.
                  </span>
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Each layer docks onto the core as it&apos;s built. By the end
                  of this scroll, you&apos;re looking at the whole system —
                  running in your environment, on your inboxes.
                </p>

                <ol className="mt-9 space-y-3">
                  {STAGES.map((s, i) => (
                    <li key={s.n} className="flex items-center gap-3">
                      <span
                        className={`h-px transition-all duration-500 ${
                          i === active
                            ? "w-9 bg-gradient-to-r from-cyan-400 to-violet-500"
                            : "w-4 bg-white/15"
                        }`}
                      />
                      <span
                        className={`font-mono text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                          i === active ? "text-white" : "text-zinc-600"
                        }`}
                      >
                        {s.kicker}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Right — the stage panels, cross-fading in place */}
              <div className="relative h-[26rem] w-full sm:h-[24rem]">
                {STAGES.map((s, i) => (
                  <motion.article
                    key={s.n}
                    aria-hidden={i !== active}
                    className="absolute inset-0 flex flex-col justify-center"
                    initial={false}
                    animate={{
                      opacity: i === active ? 1 : 0,
                      y: reduced ? 0 : i === active ? 0 : 22,
                      filter: i === active ? "blur(0px)" : "blur(6px)",
                    }}
                    transition={{ duration: 0.55, ease: EASE }}
                    style={{ pointerEvents: i === active ? "auto" : "none" }}
                  >
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 backdrop-blur-md sm:p-9">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] tracking-[0.25em] text-cyan-300">
                          {s.n}
                        </span>
                        <span className="h-px w-6 bg-gradient-to-r from-cyan-400 to-violet-500" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                          {s.kicker}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-bold leading-tight tracking-[-0.02em] text-white sm:text-3xl">
                        {s.title}
                      </h3>
                      <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                        {s.body}
                      </p>

                      <ul className="mt-6 flex flex-wrap gap-2">
                        {s.points.map((p) => (
                          <li
                            key={p}
                            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-zinc-300"
                          >
                            <Check className="h-3 w-3 text-cyan-400" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile progress ticks */}
          <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-2 lg:hidden">
            {STAGES.map((s, i) => (
              <span
                key={s.n}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === active ? "w-7 bg-gradient-to-r from-cyan-400 to-violet-500" : "w-3 bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
