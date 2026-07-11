"use client";

import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type MotionValue,
} from "framer-motion";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  EASE,
  Eyebrow,
  Lines,
  MaskReveal,
  useReducedMotionSafe,
} from "./motion";

// ── Content ───────────────────────────────────────────────────
// The 6 capabilities — verbatim copy. `accent` keys a code-drawn visual.

type Accent = "boot" | "team" | "score" | "approve" | "inbox" | "lock";

type Feature = {
  index: string;
  title: string;
  body: string;
  accent: Accent;
};

const FEATURES: Feature[] = [
  {
    index: "01",
    title: "Works out of the box",
    body: "No API keys, no per-tool setup. The AI and data sources are fully managed — sign up, describe your service, and your first leads are ready in minutes.",
    accent: "boot",
  },
  {
    index: "02",
    title: "Built for teams",
    body: "Invite the whole team into one workspace — same leads, campaigns, and results, with roles to control who can do what.",
    accent: "team",
  },
  {
    index: "03",
    title: "Only the best fits",
    body: "Every lead scored 0–100 on how much they need your service. See instantly who's worth your time and skip everyone who isn't.",
    accent: "score",
  },
  {
    index: "04",
    title: "You approve every email",
    body: "AI writes the first draft. You read, edit, or regenerate before anything sends. You're always in control.",
    accent: "approve",
  },
  {
    index: "05",
    title: "Sends from your inbox",
    body: "Emails go out from your own Gmail — not a shared pool. Replies land with you. It reads like you wrote every one.",
    accent: "inbox",
  },
  {
    index: "06",
    title: "Your data stays private",
    body: "Your Gmail connection and account credentials are encrypted before storage. We can't read them; they never appear in any log.",
    accent: "lock",
  },
];

const N = FEATURES.length;

// ── Code-drawn accents ────────────────────────────────────────
// Each is glassy, on-brand, and small. `active` lets the pinned card fire its
// internal motion only when it's the panel in focus.

// 01 — boot: a terminal-ish "ready in minutes" sequence
function BootAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const lines = [
    { k: "$", v: "describe your service", done: true },
    { k: "→", v: "finding real businesses on maps", done: true },
    { k: "✓", v: "first leads ready", done: true },
  ];
  return (
    <div
      className="w-full rounded-2xl border border-white/[0.08] bg-black/30 p-4 font-mono"
      aria-hidden
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span className="ml-1 text-[9px] uppercase tracking-[0.2em] text-zinc-600">
          setup
        </span>
      </div>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <motion.div
            key={l.v}
            className="flex items-center gap-2.5 text-[12px]"
            initial={{ opacity: 0, x: reduced ? 0 : -10 }}
            animate={{
              opacity: active ? 1 : 0,
              x: active ? 0 : reduced ? 0 : -10,
            }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.18, ease: EASE }}
          >
            <span
              className={
                i === 2 ? "text-cyan-400" : "text-violet-400"
              }
            >
              {l.k}
            </span>
            <span className={i === 2 ? "text-white" : "text-zinc-400"}>
              {l.v}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-3 py-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        <span className="text-[10px] tracking-[0.15em] text-violet-200">
          ~3 MIN TO FIRST LEADS
        </span>
      </motion.div>
    </div>
  );
}

// 02 — team: overlapping member avatars + role chips
function TeamAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const members = [
    { id: "AK", role: "Owner", grad: "from-indigo-500 to-violet-500" },
    { id: "MR", role: "Admin", grad: "from-violet-500 to-fuchsia-500" },
    { id: "JD", role: "Member", grad: "from-cyan-500 to-indigo-500" },
    { id: "+4", role: "", grad: "from-white/10 to-white/5" },
  ];
  return (
    <div
      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
      aria-hidden
    >
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        One workspace · shared pipeline
      </p>
      <div className="flex items-center">
        {members.map((m, i) => (
          <motion.span
            key={m.id}
            className={`-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#08070e] bg-gradient-to-br ${m.grad} font-mono text-[12px] font-bold text-white first:ml-0`}
            initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
            animate={{
              opacity: active ? 1 : 0,
              scale: active ? 1 : reduced ? 1 : 0.6,
            }}
            transition={{
              duration: 0.4,
              delay: 0.12 + i * 0.1,
              ease: EASE,
            }}
          >
            {m.id}
          </motion.span>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {["Owner", "Admin", "Member"].map((r, i) => (
          <motion.span
            key={r}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] text-zinc-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.45 + i * 0.08 }}
          >
            {r}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// 03 — score: a 0–100 radial dial that counts up when active
function ScoreAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const target = 94;
  const R = 46;
  const C = 2 * Math.PI * R;
  // pathLength-driven arc (0..1) — same trick StoryScroll uses, avoids JS RAF.
  const fill = reduced ? target / 100 : active ? target / 100 : 0;

  return (
    <div
      className="flex w-full items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
      aria-hidden
    >
      <div className="relative h-[124px] w-[124px] shrink-0">
        <svg viewBox="0 0 124 124" className="h-full w-full -rotate-90">
          <circle
            cx="62"
            cy="62"
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="7"
          />
          <motion.circle
            cx="62"
            cy="62"
            r={R}
            fill="none"
            stroke="url(#railScoreGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: fill }}
            transition={{ duration: 1.3, delay: 0.2, ease: EASE }}
          />
          <defs>
            <linearGradient id="railScoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <DialNumber active={active} target={target} />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
            fit score
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {[
          { label: "Company fit", w: "94%" },
          { label: "Intent", w: "78%" },
          { label: "Reachable", w: "88%" },
        ].map((row, i) => (
          <div key={row.label} className="flex items-center gap-2.5">
            <span className="w-[68px] shrink-0 font-mono text-[10px] text-zinc-500">
              {row.label}
            </span>
            <div className="h-px flex-1 rounded-full bg-white/[0.07]">
              <motion.div
                className="h-px rounded-full bg-gradient-to-r from-indigo-400 to-violet-400"
                initial={{ width: 0 }}
                animate={{ width: active || reduced ? row.w : 0 }}
                transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: EASE }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Count-up for the dial center — RAF-driven, restarts when the panel activates.
function DialNumber({ active, target }: { active: boolean; target: number }) {
  const reduced = useReducedMotionSafe();
  const [n, setN] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setN(target);
      return;
    }
    if (!active) {
      setN(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, target]);

  return (
    <span className="font-mono text-3xl font-bold tabular-nums text-white">
      {n}
    </span>
  );
}

// 04 — approve: a draft with edit/regenerate/send controls + sparkle
function ApproveAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  return (
    <div
      className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/[0.07] pb-3 font-mono text-[11px]">
        <span className="text-zinc-600">Subj</span>
        <span className="truncate text-white">A quick idea for your Q3 push</span>
        <motion.svg
          viewBox="0 0 24 24"
          className="ml-auto h-3.5 w-3.5 shrink-0 text-violet-400"
          fill="currentColor"
          initial={{ opacity: 0, rotate: -20 }}
          animate={{
            opacity: active ? 1 : 0,
            rotate: active ? 0 : -20,
          }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
        >
          <path d="M12 2l1.6 4.8L18 8l-4.4 1.2L12 14l-1.6-4.8L6 8l4.4-1.2z" />
        </motion.svg>
      </div>
      <div className="mt-3 space-y-1.5">
        {["w-full", "w-[92%]", "w-[78%]"].map((w, i) => (
          <motion.div
            key={w}
            className={`h-1.5 rounded-full bg-white/[0.08] ${w}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {[
          { label: "Edit", primary: false },
          { label: "Regenerate", primary: false },
          { label: "Approve & send", primary: true },
        ].map((b, i) => (
          <motion.span
            key={b.label}
            className={
              b.primary
                ? "ml-auto rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-[10px] font-semibold text-white"
                : "rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] text-zinc-400"
            }
            initial={{ opacity: 0, y: reduced ? 0 : 6 }}
            animate={{
              opacity: active ? 1 : 0,
              y: active ? 0 : reduced ? 0 : 6,
            }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.08, ease: EASE }}
          >
            {b.label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// 05 — inbox: an envelope landing in "your" Gmail with a reply
function InboxAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  const rows = [
    { name: "Reply from Maya", time: "9:41 AM", unread: true, mine: true },
    { name: "you → maya@northvale", time: "Yesterday", unread: false, mine: false },
  ];
  return (
    <div
      className="w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]"
      aria-hidden
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-cyan-400" fill="none">
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M3.5 6.5L12 13l8.5-6.5"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          your gmail
        </span>
        <span className="ml-auto font-mono text-[10px] text-indigo-400">
          sent as you
        </span>
      </div>
      {rows.map((r, i) => (
        <motion.div
          key={r.name}
          className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3 last:border-0"
          initial={{ opacity: 0, x: reduced ? 0 : 14 }}
          animate={{
            opacity: active ? 1 : 0,
            x: active ? 0 : reduced ? 0 : 14,
          }}
          transition={{ duration: 0.45, delay: 0.2 + i * 0.14, ease: EASE }}
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{
              background: r.unread
                ? "linear-gradient(135deg,#6366F1,#8B5CF6)"
                : "rgba(255,255,255,0.08)",
            }}
          >
            {r.unread ? "M" : "Y"}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {r.unread && (
                <span className="h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
              )}
              <span
                className={`truncate text-[12px] ${
                  r.unread ? "font-medium text-white" : "text-zinc-400"
                }`}
              >
                {r.name}
              </span>
            </div>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-zinc-600">
            {r.time}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// 06 — lock: an encryption shackle that snaps shut + masked secret
function LockAccent({ active }: { active: boolean }) {
  const reduced = useReducedMotionSafe();
  return (
    <div
      className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
      aria-hidden
    >
      <div className="relative">
        <motion.svg
          viewBox="0 0 48 48"
          className="h-16 w-16 text-violet-300"
          fill="none"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.8 }}
          animate={{
            opacity: active ? 1 : 0,
            scale: active ? 1 : reduced ? 1 : 0.8,
          }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
        >
          {/* body */}
          <rect
            x="11"
            y="21"
            width="26"
            height="20"
            rx="4"
            fill="url(#railLockGrad)"
            opacity="0.18"
            stroke="url(#railLockGrad)"
            strokeWidth="1.6"
          />
          {/* shackle — draws shut when active */}
          <motion.path
            d="M16 21v-4a8 8 0 0 1 16 0v4"
            stroke="url(#railLockGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            initial={{ pathLength: reduced ? 1 : 0 }}
            animate={{ pathLength: active ? 1 : reduced ? 1 : 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          />
          <circle cx="24" cy="30" r="2.4" fill="#c4b5fd" />
          <defs>
            <linearGradient id="railLockGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </motion.svg>
        {!reduced && (
          <motion.span
            className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl"
            animate={{ opacity: active ? [0, 0.7, 0.25] : 0 }}
            transition={{ duration: 1, ease: EASE }}
          />
        )}
      </div>
      <div className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono">
        <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">
          stored credential
        </p>
        <p className="mt-1 text-[13px] tracking-wider text-zinc-300">
          gmail · •••• •••• •••• ••••
        </p>
      </div>
      <p className="font-mono text-[10px] tracking-[0.1em] text-zinc-500">
        encrypted · never logged
      </p>
    </div>
  );
}

function AccentFor({ accent, active }: { accent: Accent; active: boolean }) {
  switch (accent) {
    case "boot":
      return <BootAccent active={active} />;
    case "team":
      return <TeamAccent active={active} />;
    case "score":
      return <ScoreAccent active={active} />;
    case "approve":
      return <ApproveAccent active={active} />;
    case "inbox":
      return <InboxAccent active={active} />;
    case "lock":
      return <LockAccent active={active} />;
  }
}

// ── Panel card — cursor-follow glow, lift, warming border ──────

function PanelCard({
  feature,
  active,
}: {
  feature: Feature;
  active: boolean;
}) {
  const reduced = useReducedMotionSafe();
  const cardRef = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (reduced || !cardRef.current) return;
      const r = cardRef.current.getBoundingClientRect();
      setGlow({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    },
    [reduced]
  );

  return (
    <motion.div
      ref={cardRef}
      data-cursor
      onPointerMove={onMove}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition-[border-color,transform] duration-300 hover:border-violet-500/40 sm:p-10"
      whileHover={
        reduced ? {} : { y: -6, transition: { duration: 0.3, ease: EASE } }
      }
    >
      {/* cursor-tracked bloom */}
      {!reduced && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, rgba(99,102,241,0.16), rgba(139,92,246,0.07) 40%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-600">
          {feature.index} / {FEATURES[N - 1].index}
        </span>
        <span className="h-px w-10 origin-right bg-gradient-to-r from-transparent to-violet-500/50 transition-all duration-300 group-hover:w-16" />
      </div>

      <div className="relative mt-7 max-w-[26rem]">
        <h3 className="font-black leading-[1.0] tracking-[-0.03em] text-white text-[clamp(1.7rem,3vw,2.6rem)]">
          {feature.title}
        </h3>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
          {feature.body}
        </p>
      </div>

      <div className="relative mt-auto pt-8">
        <AccentFor accent={feature.accent} active={active} />
      </div>
    </motion.div>
  );
}

// ── Pinned horizontal track (desktop / motion-on) ─────────────

function PinnedRail() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Translate the track left by (N-1) panel-widths over the scroll. Each panel
  // is sized so ~1.2 are visible; the last frame lands the final panel centered.
  // Track total width ≈ N panels; we shift by the overflow fraction.
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${((N - 1) / N) * 100}%`]
  );
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const [activeIdx, setActiveIdx] = useState(0);

  // Track the active panel for the counter + internal accent firing.
  useScrollActive(scrollYProgress, setActiveIdx);

  return (
    <div ref={sectionRef} className="relative hidden h-[360vh] lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        {/* top progress bar */}
        <div className="relative z-10 h-px w-full bg-white/[0.06]">
          <motion.div
            className="h-px origin-left bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400"
            style={{ scaleX: progressScaleX }}
          />
        </div>

        {/* counter — fixed top-right of the pinned viewport */}
        <div className="pointer-events-none absolute right-8 top-8 z-10 font-mono text-[11px] tabular-nums text-zinc-500">
          <span className="text-white">
            {FEATURES[activeIdx].index}
          </span>
          <span className="mx-1 text-zinc-700">/</span>
          <span>{FEATURES[N - 1].index}</span>
        </div>

        {/* horizontal track */}
        <div className="flex flex-1 items-center">
          <motion.div
            style={{ x }}
            className="flex w-max gap-8 px-[8vw] will-change-transform"
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.index}
                className="w-[72vw] shrink-0 py-2 xl:w-[64vw]"
                style={{ height: "min(70vh, 640px)" }}
              >
                <PanelCard feature={f} active={i === activeIdx} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* dot indicators */}
        <div className="relative z-10 flex justify-center gap-2 pb-8">
          {FEATURES.map((f, i) => (
            <span
              key={f.index}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIdx
                  ? "w-7 bg-gradient-to-r from-indigo-400 to-violet-400"
                  : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Subscribe to scroll progress → active panel index. Split into a hook so the
// effect cleanup is colocated and the component above stays declarative.
function useScrollActive(
  progress: MotionValue<number>,
  set: (i: number) => void
) {
  useEffect(() => {
    const unsub = progress.on("change", (p) => {
      // p in [0,1] maps across N panels; bias slightly so a panel is "active"
      // while it occupies center.
      const idx = Math.min(N - 1, Math.max(0, Math.round(p * (N - 1))));
      set(idx);
    });
    return () => unsub();
  }, [progress, set]);
}

// ── Static stack (mobile / reduced motion) ────────────────────

function StackRail() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 lg:hidden">
      <div className="space-y-5">
        {FEATURES.map((f) => (
          <MaskReveal key={f.index}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-600">
                  {f.index} / {FEATURES[N - 1].index}
                </span>
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-violet-500/50" />
              </div>
              <h3 className="mt-5 font-black leading-[1.02] tracking-[-0.03em] text-white text-[clamp(1.5rem,7vw,2rem)]">
                {f.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
                {f.body}
              </p>
              <div className="mt-6">
                {/* always-active so accents render fully without scroll wiring */}
                <AccentFor accent={f.accent} active />
              </div>
            </div>
          </MaskReveal>
        ))}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────

export function FeatureRail() {
  const reduced = useReducedMotionSafe();
  const headerRef = useRef<HTMLDivElement>(null);
  useInView(headerRef, { once: true, margin: "-10%" }); // warms reveal timing

  // overflow-x-clip (not overflow-hidden) on the section clips the wide
  // horizontal track without creating a scroll container that would break
  // the inner sticky pin.
  return (
    <section
      id="features"
      className="relative overflow-x-clip bg-[#07060d] py-[clamp(7rem,13vw,12rem)] lg:pb-[clamp(3rem,6vw,5rem)]"
    >
      {/* faint aurora glow so the band never reads as flat black */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(99,102,241,0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      {/* header — left-anchored, asymmetric */}
      <div
        ref={headerRef}
        className="relative mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-8 px-6 lg:grid-cols-[1fr_auto] lg:items-end"
      >
        <div>
          <MaskReveal>
            <Eyebrow>WHAT YOU GET</Eyebrow>
          </MaskReveal>
          <h2 className="mt-7 font-black leading-[0.94] tracking-[-0.04em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]">
            <Lines text={"Everything to fill\nyour pipeline."} delay={0.05} />
          </h2>
        </div>
        <MaskReveal delay={0.2} className="lg:max-w-[340px] lg:pb-2">
          <p className="text-sm leading-relaxed text-zinc-400 lg:text-right">
            No duct-taped stack. No six-tool workflow. One platform — from
            finding the lead to sending the email.
          </p>
        </MaskReveal>
      </div>

      {/* scroll-cue for the horizontal pin — desktop only */}
      {!reduced && (
        <div className="relative mx-auto mt-10 hidden w-full max-w-[1320px] px-6 lg:block">
          <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">
            <span className="h-px w-8 bg-gradient-to-r from-cyan-400/60 to-transparent" />
            scroll to explore →
          </span>
        </div>
      )}

      <div className="relative mt-[clamp(2.5rem,5vw,4rem)]">
        {reduced ? (
          <StackRail />
        ) : (
          <>
            <PinnedRail />
            <StackRail />
          </>
        )}
      </div>
    </section>
  );
}
