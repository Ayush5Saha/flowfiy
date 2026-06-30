"use client";

import { useState } from "react";

// Unlisted YouTube walkthrough — https://youtu.be/T3E6Bkrt_68
export const DEMO_VIDEO_ID = "T3E6Bkrt_68";

/**
 * Click-to-play YouTube facade. Renders only the HD thumbnail + play button
 * until clicked, then swaps in the youtube-nocookie iframe — so the heavy
 * YouTube player never touches initial page load (keeps the hero LCP fast).
 * Fills its container at 16:9 (aspect-video); thumbnail falls back maxres → hq.
 */
export function DemoVideoPlayer({ className = "" }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [hiRes, setHiRes] = useState(true);

  const thumb = hiRes
    ? `https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/maxresdefault.jpg`
    : `https://i.ytimg.com/vi/${DEMO_VIDEO_ID}/hqdefault.jpg`;

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-[0_40px_120px_-30px_rgba(99,102,241,0.45)] backdrop-blur-sm ${className}`}
    >
      {/* ambient glow behind the frame */}
      <div className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.22),transparent_60%)] blur-2xl" />

      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
          title="Flowfiy demo — how to use Flowfiy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label="Play the Flowfiy demo video"
          className="group absolute inset-0 h-full w-full"
        >
          {/* thumbnail */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            onError={() => setHiRes(false)}
            alt="Flowfiy product demo — a walkthrough of finding leads and sending outreach"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* darkening overlay for contrast */}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/40 transition-opacity duration-300 group-hover:from-black/60" />

          {/* play button */}
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-70 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
            <svg viewBox="0 0 24 24" className="relative ml-1 h-7 w-7 fill-white sm:h-8 sm:w-8" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>

          {/* corner label */}
          <span className="absolute bottom-4 left-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85">
            ▶ Product walkthrough
          </span>
        </button>
      )}
    </div>
  );
}
