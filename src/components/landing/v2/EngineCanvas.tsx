"use client";

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "./motion";

// ── EngineCanvas ──────────────────────────────────────────────
// The hero's living signature: light packets streaming along curved bezier lanes,
// past pulsing station nodes, drifting aurora blobs, bending toward the cursor.
// Right-weighted: lanes converge toward the right two-thirds so left text stays clear.
//
// Engineering: DPR-aware sizing, delta-time rAF, IntersectionObserver + tab-visibility
// pause, full teardown. Additive glow via a pre-rendered sprite (no per-frame shadowBlur).
// Reduced motion → one static frame, no loop.

type RGB = readonly [number, number, number];
const INDIGO: RGB = [99, 102, 241];
const VIOLET: RGB = [139, 92, 246];
const CYAN: RGB = [34, 211, 238];

const LANE_COUNT = 3;
const NODE_COUNT = 5;
const PACKETS = 90; // within the 70–110 budget
const SAMPLES = 64; // precomputed points per lane
const CURSOR_RADIUS = 220;

type Lane = {
  pts: { x: number; y: number }[]; // normalized 0..1, precomputed bezier samples
};
type Packet = {
  lane: number;
  phase: number; // 0..1 position along lane
  speed: number;
  size: number;
  color: RGB;
};
type Node = {
  lane: number;
  phase: number;
  pulse: number; // 0..1, decays each frame
};

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

export function EngineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext("2d", { alpha: true });
    if (!context) return;
    // Non-null aliases so TS keeps the narrowing inside nested closures.
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    let raf = 0;
    let running = false;
    let last = performance.now();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;

    const mouse = { x: -9999, y: -9999, active: false };
    // Per-packet cursor-bend offset that lerps in and springs back.
    const bend = new Float32Array(PACKETS * 2);

    // ── Lanes: right-weighted curves crossing horizontally with vertical spread ──
    const laneDefs: { y0: number; y1: number; sag: number }[] = [
      { y0: 0.30, y1: 0.46, sag: -0.08 },
      { y0: 0.52, y1: 0.50, sag: 0.06 }, // central lane (carries the nodes)
      { y0: 0.74, y1: 0.58, sag: 0.10 },
    ];
    const lanes: Lane[] = laneDefs.map((d) => {
      // Control points biased right so flow converges toward the right two-thirds.
      const p0 = { x: -0.05, y: d.y0 };
      const p1 = { x: 0.45, y: d.y0 + d.sag };
      const p2 = { x: 0.75, y: d.y1 - d.sag };
      const p3 = { x: 1.05, y: d.y1 };
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        pts.push({
          x: cubicAt(p0.x, p1.x, p2.x, p3.x, t),
          y: cubicAt(p0.y, p1.y, p2.y, p3.y, t),
        });
      }
      return { pts };
    });

    const CENTRAL = 1;
    const packets: Packet[] = Array.from({ length: PACKETS }, (_, i) => {
      const r = i % 8;
      const color = r === 0 ? CYAN : i % 2 === 0 ? INDIGO : VIOLET; // ~12% cyan
      return {
        lane: i % LANE_COUNT,
        phase: Math.random(),
        speed: 0.018 + Math.random() * 0.03,
        size: 1.4 + Math.random() * 2.0,
        color,
      };
    });
    const nodes: Node[] = Array.from({ length: NODE_COUNT }, (_, i) => ({
      lane: CENTRAL,
      phase: 0.12 + (i / (NODE_COUNT - 1)) * 0.76,
      pulse: 0,
    }));

    // ── Pre-rendered additive glow sprites, one per color (drawn once) ──
    // White-hot core fading to the packet's hue, so additive blending reads as a glow.
    const SPRITE = 64;
    function makeSprite(c: RGB) {
      const cv = document.createElement("canvas");
      cv.width = SPRITE;
      cv.height = SPRITE;
      const sc = cv.getContext("2d")!;
      const gr = sc.createRadialGradient(
        SPRITE / 2,
        SPRITE / 2,
        0,
        SPRITE / 2,
        SPRITE / 2,
        SPRITE / 2,
      );
      gr.addColorStop(0, "rgba(255,255,255,0.95)");
      gr.addColorStop(0.3, `rgba(${c[0]},${c[1]},${c[2]},0.6)`);
      gr.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
      sc.fillStyle = gr;
      sc.fillRect(0, 0, SPRITE, SPRITE);
      return cv;
    }
    const sprites = new Map<RGB, HTMLCanvasElement>([
      [INDIGO, makeSprite(INDIGO)],
      [VIOLET, makeSprite(VIOLET)],
      [CYAN, makeSprite(CYAN)],
    ]);

    function lanePoint(lane: number, phase: number) {
      const pts = lanes[lane].pts;
      const f = Math.max(0, Math.min(0.9999, phase)) * SAMPLES;
      const i = Math.floor(f);
      const frac = f - i;
      const a = pts[i];
      const b = pts[Math.min(SAMPLES, i + 1)];
      return { x: (a.x + (b.x - a.x) * frac) * W, y: (a.y + (b.y - a.y) * frac) * H };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawAurora(now: number) {
      const t = now * 0.00004;
      const blobs: { cx: number; cy: number; r: number; c: RGB }[] = [
        {
          cx: 0.62 + Math.sin(t) * 0.05,
          cy: 0.35 + Math.cos(t * 0.8) * 0.04,
          r: 0.55,
          c: INDIGO,
        },
        {
          cx: 0.82 + Math.cos(t * 0.7) * 0.04,
          cy: 0.6 + Math.sin(t * 1.1) * 0.05,
          r: 0.5,
          c: VIOLET,
        },
      ];
      for (const b of blobs) {
        const cx = b.cx * W;
        const cy = b.cy * H;
        const rad = b.r * Math.max(W, H);
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grd.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0.08)`);
        grd.addColorStop(1, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},0)`);
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function drawLanes() {
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      for (const lane of lanes) {
        ctx.beginPath();
        const p0 = lane.pts[0];
        ctx.moveTo(p0.x * W, p0.y * H);
        for (let i = 1; i < lane.pts.length; i++) {
          ctx.lineTo(lane.pts[i].x * W, lane.pts[i].y * H);
        }
        ctx.stroke();
      }
    }

    function drawNodes() {
      for (const n of nodes) {
        const p = lanePoint(n.lane, n.phase);
        const baseR = 6;
        const r = baseR * (1 + n.pulse * 0.9);
        const alpha = 0.18 + n.pulse * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180,190,255,${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    function drawPackets() {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < packets.length; i++) {
        const pk = packets[i];
        const p = lanePoint(pk.lane, pk.phase);
        const x = p.x + bend[i * 2];
        const y = p.y + bend[i * 2 + 1];
        const s = pk.size * 7; // sprite draw size
        ctx.globalAlpha = 0.85;
        ctx.drawImage(sprites.get(pk.color)!, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function step(dt: number) {
      // cursor proximity per packet → lerp bend offset toward cursor, else spring back
      for (let i = 0; i < packets.length; i++) {
        const pk = packets[i];
        const p = lanePoint(pk.lane, pk.phase);
        let tx = 0;
        let ty = 0;
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CURSOR_RADIUS && dist > 0.01) {
            const pull = (1 - dist / CURSOR_RADIUS) * 26;
            tx = (dx / dist) * pull;
            ty = (dy / dist) * pull;
          }
        }
        bend[i * 2] += (tx - bend[i * 2]) * Math.min(1, dt * 4);
        bend[i * 2 + 1] += (ty - bend[i * 2 + 1]) * Math.min(1, dt * 4);

        pk.phase += pk.speed * dt;
        if (pk.phase > 1) pk.phase -= 1;
      }

      // node pulse: bump when a packet on the central lane passes within range
      for (const n of nodes) {
        for (const pk of packets) {
          if (pk.lane !== n.lane) continue;
          if (Math.abs(pk.phase - n.phase) < 0.012) {
            n.pulse = 1;
            break;
          }
        }
        n.pulse *= Math.max(0, 1 - dt * 2.2);
      }
    }

    function render(now: number) {
      ctx.clearRect(0, 0, W, H);
      drawAurora(now);
      drawLanes();
      drawNodes();
      drawPackets();
    }

    function frame(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      render(now);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    }
    function onPointerLeave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }
    function onResize() {
      resize();
      if (reduced) render(performance.now()); // re-paint static frame on resize
    }
    function onVisibility() {
      if (document.hidden) stop();
      else if (!reduced && visible) start();
    }

    // ── Init ──
    resize();

    let visible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (reduced) return;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    if (reduced) {
      render(performance.now()); // single static frame, no loop
    } else if (!document.hidden) {
      start();
    }

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
    />
  );
}
