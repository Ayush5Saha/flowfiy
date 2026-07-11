"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE, Eyebrow, Lines, MaskReveal, useReducedMotionSafe } from "./motion";

// ── Content ───────────────────────────────────────────────────
// Five steps of the autonomous pipeline — verbatim copy.

type Step = {
  index: string;
  kicker: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    index: "01",
    kicker: "FIND",
    title: "Describe your service. We find real businesses.",
    body: "In plain English, or by condition — like \"restaurants with no website\" or \"dentists with bad reviews.\" Flowfiy searches Google Maps and a B2B people database for real, live businesses, not a stale contact list.",
  },
  {
    index: "02",
    kicker: "RESEARCH",
    title: "AI researches every business it finds",
    body: "Flowfiy reads each business's website, reviews, and public signals — building a real picture of who they are before it ever reaches out.",
  },
  {
    index: "03",
    kicker: "QUALIFY",
    title: "Scored 0–100 on how much they need you",
    body: "Every business gets a fit score based on how much it actually needs your specific service. You only pay for qualified leads — an empty search costs nothing.",
  },
  {
    index: "04",
    kicker: "OUTREACH",
    title: "Personalized outreach, written for each one",
    body: "Flowfiy writes a personalized message and follow-ups for every qualified lead, using what it learned in research — ready to send from your own Gmail.",
  },
  {
    index: "05",
    kicker: "REVIEW",
    title: "Review, then it sends itself",
    body: "Every lead and draft lands ready for review. Approve what you like and Flowfiy sends it straight from your own Gmail.",
  },
];

const N = STEPS.length;

// ── Stage device UIs — code-drawn, glassy, on-brand ───────────

function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] backdrop-blur-sm">
      {/* top chrome bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          flowfiy · engine
        </span>
        <span className="relative ml-auto inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </span>
      </div>
      <div className="relative h-[calc(100%-3.25rem)] p-6">{children}</div>
    </div>
  );
}

// Stage 01 — ICP target chips
function StageDiscover() {
  const fields = [
    { k: "Type", v: "Coffee shops" },
    { k: "Where", v: "Austin, TX" },
    { k: "Condition", v: "No website" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
        You describe
      </p>
      {fields.map((f, i) => (
        <motion.div
          key={f.k}
          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 + i * 0.1, duration: 0.5, ease: EASE }}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            {f.k}
          </span>
          <span className="text-sm font-medium text-white">{f.v}</span>
        </motion.div>
      ))}
      <motion.div
        className="mt-2 inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-3.5 py-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="font-mono text-[11px] text-violet-200">
          Request set
        </span>
      </motion.div>
    </div>
  );
}

// Stage 02 — researched company card
function StageResearch() {
  const rows = [
    "Reading their website",
    "Checking recent reviews",
    "Scanning public signals",
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 font-mono text-sm font-bold text-white">
          AI
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Flowfiy</p>
          <p className="font-mono text-[11px] text-zinc-500">
            Researching this business
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.12, duration: 0.5, ease: EASE }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            <span className="text-[13px] leading-snug text-zinc-300">{r}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        Building the picture
      </p>
    </div>
  );
}

// Stage 03 — 0–100 score gauge
function StageQualify({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const target = 92;
  const [n, setN] = useState(reduced ? target : 0);

  useEffect(() => {
    if (!active || reduced) {
      setN(target);
      return;
    }
    setN(0);
    let raf = 0;
    const start = performance.now();
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (n / 100) * C;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative h-[140px] w-[140px]">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="url(#scoreGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold tabular-nums text-white">
            {n}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            fit score
          </span>
        </div>
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="font-mono text-[11px] text-emerald-200">
          High-fit lead
        </span>
      </div>
    </div>
  );
}

// Stage 04 — email being written
function StageWrite({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const full =
    "Saw Bella Napoli has 200+ five-star reviews but no website yet — most diners search before they call. Happy to show you what one could look like.";
  const [len, setLen] = useState(reduced ? full.length : 0);

  useEffect(() => {
    if (!active || reduced) {
      setLen(full.length);
      return;
    }
    setLen(0);
    let raf = 0;
    const start = performance.now();
    const dur = 1600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setLen(Math.round(p * full.length));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced]);

  const typed = full.slice(0, len);
  const typing = len < full.length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-2 border-b border-white/[0.07] pb-3 font-mono text-[11px]">
        <div className="flex gap-2">
          <span className="w-10 text-zinc-600">To</span>
          <span className="text-zinc-300">tony@bellanapoli.com</span>
        </div>
        <div className="flex gap-2">
          <span className="w-10 text-zinc-600">Subj</span>
          <span className="text-white">Bella Napoli doesn&apos;t have a website yet</span>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-zinc-300">
        {typed}
        {!reduced && typing && (
          <motion.span
            className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] bg-violet-400 align-middle"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
          />
        )}
      </p>
      <div className="mt-auto flex items-center gap-2">
        {["Intro", "Follow-up 1", "Follow-up 2"].map((c, i) => (
          <span
            key={c}
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${
              i === 0
                ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
                : "border-white/10 text-zinc-500"
            }`}
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

// Stage 05 — booked calendar tick
function StageBook({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500"
          initial={reduced ? { scale: 1 } : { scale: 0.6, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={active ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            />
          </svg>
        </motion.div>
        {!reduced && (
          <motion.span
            className="absolute inset-0 rounded-2xl bg-violet-500/40 blur-xl"
            animate={active ? { opacity: [0, 0.8, 0.3] } : { opacity: 0 }}
            transition={{ duration: 1, ease: EASE }}
          />
        )}
      </div>
      <div className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Booked · to your calendar
        </p>
        <p className="mt-1.5 text-sm font-semibold text-white">
          Intro call — Tony, Bella Napoli
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-cyan-300">
          Thu · 10:30 AM · 30 min
        </p>
      </div>
      <p className="font-mono text-[11px] text-zinc-500">You wake up to pipeline.</p>
    </div>
  );
}

// ── Stage layer — crossfades by scroll window ─────────────────

function StageLayer({
  i,
  progress,
  children,
}: {
  i: number;
  progress: MotionValue<number>;
  children: (active: boolean) => React.ReactNode;
}) {
  // Each stage owns a 1/N slice of progress. Build a small crossfade window
  // around its slice so adjacent stages dissolve cleanly into one another.
  const seg = 1 / N;
  const center = (i + 0.5) * seg;
  const fade = seg * 0.45;
  const opacity = useTransform(
    progress,
    [center - seg / 2 - fade, center - seg / 2 + fade, center + seg / 2 - fade, center + seg / 2 + fade],
    [0, 1, 1, 0],
  );
  const scale = useTransform(
    progress,
    [center - seg / 2 - fade, center, center + seg / 2 + fade],
    [0.97, 1, 0.97],
  );

  // Track whether this stage is the active one so its internal animation
  // (typing, count-up, tick) fires when it comes into view.
  const [active, setActive] = useState(i === 0);
  useEffect(() => {
    const unsub = progress.on("change", (p) => {
      const lo = i * seg;
      const hi = (i + 1) * seg;
      setActive(p >= lo - 0.001 && p < hi);
    });
    return () => unsub();
  }, [i, seg, progress]);

  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute inset-0"
      aria-hidden={!active}
    >
      <DeviceFrame>{children(active)}</DeviceFrame>
    </motion.div>
  );
}

// ── Pinned (desktop / motion-on) experience ───────────────────

function PinnedStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Rail fill follows scroll.
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Light packet drifts down the connector across the whole scroll.
  const packetY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  // Active step index for the left text column.
  const [step, setStep] = useState(0);
  useEffect(() => {
    const unsub = scrollYProgress.on("change", (p) => {
      const idx = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
      setStep(idx);
    });
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <div ref={sectionRef} className="relative hidden h-[520vh] lg:block">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1320px] grid-cols-12 items-center gap-12 px-6">
          {/* LEFT — sticky narrative + rail */}
          <div className="col-span-5 flex gap-8">
            {/* progress rail */}
            <div className="relative mt-2 h-[260px] w-px shrink-0 bg-white/10">
              <motion.div
                className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-indigo-400 to-violet-500"
                style={{ scaleY: railScale, height: "100%" }}
              />
              {/* drifting light packet */}
              <motion.span
                className="absolute -left-[3px] h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.7)]"
                style={{ top: packetY }}
              />
              {/* stage notches */}
              {STEPS.map((s, i) => (
                <span
                  key={s.index}
                  className="absolute -left-[2px] h-1 w-[5px] rounded-full bg-white/20"
                  style={{ top: `${(i / (N - 1)) * 100}%` }}
                />
              ))}
            </div>

            <div className="relative min-h-[300px] flex-1">
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.index}
                  className="absolute inset-0 flex flex-col justify-center"
                  initial={false}
                  animate={{
                    opacity: step === i ? 1 : 0,
                    y: step === i ? 0 : step > i ? -24 : 24,
                  }}
                  transition={{ duration: 0.55, ease: EASE }}
                  style={{ pointerEvents: step === i ? "auto" : "none" }}
                >
                  <div className="flex items-baseline gap-4">
                    <span className="font-mono text-5xl font-black tabular-nums text-transparent bg-gradient-to-br from-indigo-400 to-violet-500 bg-clip-text">
                      {s.index}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/90">
                      {s.kicker}
                    </span>
                  </div>
                  <h3 className="mt-5 max-w-md font-black leading-[1.02] tracking-[-0.03em] text-white text-[clamp(1.7rem,2.6vw,2.4rem)]">
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-zinc-400">
                    {s.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* RIGHT — morphing device */}
          <div className="col-span-7 flex justify-end">
            <div className="relative aspect-[4/3.4] w-full max-w-[560px]">
              {/* ambient glow behind device */}
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(99,102,241,0.18),transparent_60%)] blur-2xl" />
              <StageLayer i={0} progress={scrollYProgress}>
                {() => <StageDiscover />}
              </StageLayer>
              <StageLayer i={1} progress={scrollYProgress}>
                {() => <StageResearch />}
              </StageLayer>
              <StageLayer i={2} progress={scrollYProgress}>
                {(active) => <StageQualify active={active} />}
              </StageLayer>
              <StageLayer i={3} progress={scrollYProgress}>
                {(active) => <StageWrite active={active} />}
              </StageLayer>
              <StageLayer i={4} progress={scrollYProgress}>
                {(active) => <StageBook active={active} />}
              </StageLayer>

              {/* step counter overlay */}
              <div className="absolute -bottom-9 right-1 font-mono text-[11px] tabular-nums text-zinc-600">
                {STEPS[step].index} / {STEPS[N - 1].index}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Static stack (mobile / reduced motion) ────────────────────

function StackStory() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 lg:hidden">
      <div className="space-y-5">
        {STEPS.map((s, i) => (
          <MaskReveal key={s.index} delay={0} className="">
            <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-4xl font-black tabular-nums text-transparent bg-gradient-to-br from-indigo-400 to-violet-500 bg-clip-text">
                  {s.index}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-300/90">
                  {s.kicker}
                </span>
              </div>
              <h3 className="mt-4 font-black leading-[1.05] tracking-[-0.03em] text-white text-[clamp(1.5rem,6vw,2rem)]">
                {s.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                {s.body}
              </p>
              {/* compact device preview per stage */}
              <div className="mt-6 h-[220px]">
                <DeviceFrame>
                  {i === 0 && <StageDiscover />}
                  {i === 1 && <StageResearch />}
                  {i === 2 && <StageQualify active />}
                  {i === 3 && <StageWrite active />}
                  {i === 4 && <StageBook active />}
                </DeviceFrame>
              </div>
            </div>
          </MaskReveal>
        ))}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────

export function StoryScroll() {
  const reduced = useReducedMotionSafe();

  return (
    <section
      id="how-it-works"
      className="relative bg-[#050508] py-[clamp(6rem,12vw,11rem)]"
    >
      {/* Section header */}
      <div className="mx-auto max-w-[1320px] px-6">
        <Eyebrow>HOW IT WORKS</Eyebrow>
        <h2 className="mt-7 font-black leading-[0.98] tracking-[-0.04em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]">
          <Lines text={"You describe the customer.\nWe run the rest."} />
        </h2>
      </div>

      <div className="mt-[clamp(3rem,7vw,6rem)]">
        {reduced ? (
          // Reduced motion → always the clean static stack (full width).
          <div className="mx-auto max-w-[760px]">
            <StackStory />
          </div>
        ) : (
          <>
            <PinnedStory />
            <StackStory />
          </>
        )}
      </div>
    </section>
  );
}
