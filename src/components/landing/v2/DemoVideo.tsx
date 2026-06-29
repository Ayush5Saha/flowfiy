"use client";

import { useState } from "react";
import { Eyebrow, Lines, MaskReveal } from "./motion";

// Unlisted YouTube walkthrough — https://youtu.be/T3E6Bkrt_68
const VIDEO_ID = "T3E6Bkrt_68";

/**
 * "Watch the demo" section — a click-to-play facade over the YouTube embed.
 * We render only the thumbnail + play button on load and swap in the iframe on
 * click, so the heavy YouTube player never touches initial page load (keeps LCP
 * fast). youtube-nocookie keeps it privacy-friendly; the thumbnail falls back
 * from maxres → hq if the HD frame isn't available for this upload.
 */
export function DemoVideo() {
  const [playing, setPlaying] = useState(false);
  const [hiRes, setHiRes] = useState(true);

  const thumb = hiRes
    ? `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`
    : `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`;

  return (
    <section id="demo" className="relative bg-[#030305] py-[clamp(6rem,12vw,11rem)]">
      <div className="mx-auto max-w-[1320px] px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <Eyebrow>WATCH THE DEMO</Eyebrow>
          <h2 className="mt-7 font-black leading-[0.98] tracking-[-0.04em] text-white text-[clamp(2.4rem,5.5vw,4.2rem)]">
            <Lines text={"See Flowfiy work,\nend to end."} />
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            A short walkthrough of how to use Flowfiy — describe the leads you want, watch it
            find, research and score every match, write the outreach, and send it from your Gmail.
          </p>
        </div>

        {/* Player */}
        <MaskReveal className="mt-[clamp(2.5rem,5vw,4rem)]">
          <div className="relative mx-auto aspect-video w-full max-w-[1040px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] shadow-[0_40px_120px_-30px_rgba(99,102,241,0.35)] backdrop-blur-sm">
            {/* ambient glow behind the frame */}
            <div className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.20),transparent_60%)] blur-2xl" />

            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
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
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-70 blur-lg transition-opacity duration-300 group-hover:opacity-100" />
                  <svg viewBox="0 0 24 24" className="relative ml-1 h-8 w-8 fill-white" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>

                {/* corner label */}
                <span className="absolute bottom-5 left-6 font-mono text-[11px] uppercase tracking-[0.2em] text-white/85">
                  ▶ Product walkthrough
                </span>
              </button>
            )}
          </div>
        </MaskReveal>
      </div>
    </section>
  );
}
