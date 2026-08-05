"use client";

/**
 * Routcore's 3D centrepiece — a raymarched volumetric core rendered in raw WebGL.
 *
 * A faceted, slowly-tumbling octahedral "core" sits at the origin. Up to five
 * orbital rings dock onto it as `state.stage` climbs 0 → 5, and the camera
 * orbits it as `state.scroll` climbs 0 → 1. Both are driven from React through
 * a mutable ref (never through props/state) so scroll can move the camera at
 * 60fps without re-rendering a single component.
 *
 * Deliberately dependency-free — same approach as ShaderField.tsx on the main
 * landing page. Degrades to a single static frame under reduced motion, and to
 * the parent's dark background if a GL context can't be created at all.
 */

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "@/components/landing/v2/motion";

export type CoreState = {
  /** 0–5 — how many orbital rings have docked onto the core. */
  stage: number;
  /** 0–1 — camera orbit progress around the core. */
  scroll: number;
};

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;      // -1..1, smoothed
uniform float u_scroll;     // 0..1  camera orbit progress
uniform float u_stage;      // 0..5  rings docked
uniform float u_intensity;  // 0..1  mount fade-in

mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float sdOcta(vec3 p, float s){
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.5773502691;
}

float sdTorus(vec3 p, float R, float r){
  vec2 q = vec2(length(p.xz) - R, p.y);
  return length(q) - r;
}

// vec2(distance, id) — id 1.0 = core, 2.0..6.0 = rings outward
vec2 map(vec3 p){
  vec3 q = p;
  q.xz *= rot(u_time * 0.22);
  q.xy *= rot(u_time * 0.15);
  float breathe = 0.78 + 0.028 * sin(u_time * 0.85);
  vec2 res = vec2(sdOcta(q, breathe) - 0.13, 1.0);

  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float pres = smoothstep(fi, fi + 0.9, u_stage);
    vec3 r = p;
    r.xz *= rot(u_time * (0.10 + fi * 0.045) + fi * 1.25);
    r.yz *= rot(0.45 + fi * 0.40);
    // Thickness carries the fade-in, so the distance field stays exact and the
    // march never overshoots a ring that is only partially docked.
    float d = sdTorus(r, 1.22 + fi * 0.33, 0.002 + 0.026 * pres);
    d = pres > 0.02 ? d : 60.0;
    if (d < res.x) res = vec2(d, 2.0 + fi);
  }
  return res;
}

vec3 calcNormal(vec3 p){
  vec2 e = vec2(0.0016, 0.0);
  return normalize(vec3(
    map(p + e.xyy).x - map(p - e.xyy).x,
    map(p + e.yxy).x - map(p - e.yxy).x,
    map(p + e.yyx).x - map(p - e.yyx).x
  ));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;

  // ── Camera: orbits the core as the page scrolls, nudged by the cursor ──
  float az   = 0.55 + u_scroll * 2.45 + u_mouse.x * 0.45;
  float el   = 0.16 + u_scroll * 0.30 + u_mouse.y * 0.20;
  float dist = 5.45 - u_scroll * 1.15;

  vec3 ro  = vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)) * dist;
  vec3 f   = normalize(-ro);
  vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), f));
  vec3 up  = cross(f, rgt);
  vec3 rd  = normalize(uv.x * rgt + uv.y * up + 1.55 * f);

  // ── Backdrop: deep space with a soft indigo bloom behind the core ──
  vec3 col = mix(vec3(0.011, 0.011, 0.019), vec3(0.038, 0.034, 0.072), 0.5 + 0.5 * rd.y);
  col += vec3(0.16, 0.11, 0.34) * pow(max(0.0, 1.0 - length(uv) * 0.78), 3.0) * 0.42;

  // ── March ──
  float t = 0.0, id = 0.0, glow = 0.0;
  bool hit = false;
  for (int i = 0; i < 72; i++){
    vec2 h = map(ro + rd * t);
    glow += exp(-h.x * 7.0) * 0.012;
    if (h.x < 0.0018){ hit = true; id = h.y; break; }
    t += h.x * 0.9;
    if (t > 14.0) break;
  }

  if (hit){
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    float key  = max(dot(n, normalize(vec3( 0.70, 0.90,  0.50))), 0.0);
    float fill = max(dot(n, normalize(vec3(-0.80, 0.20, -0.60))), 0.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

    vec3 base;
    if (id < 1.5){
      // Core — indigo body, cyan fill light, violet rim, faint inner emission.
      base  = mix(vec3(0.085, 0.078, 0.215), vec3(0.40, 0.345, 0.94), key);
      base += vec3(0.13, 0.83, 0.93) * fill * 0.32;
      base += vec3(0.55, 0.40, 1.00) * fres * 1.15;
      base += vec3(0.30, 0.26, 0.78) * 0.16;
    } else {
      // Rings — cyan innermost grading to violet outermost.
      vec3 rc = mix(vec3(0.13, 0.83, 0.93), vec3(0.55, 0.36, 0.97),
                    clamp((id - 2.0) / 4.0, 0.0, 1.0));
      base  = rc * (0.34 + 0.72 * key + 0.38 * fill);
      base += rc * fres * 1.45;
    }
    col = base * mix(1.0, 0.58, clamp((t - 3.0) / 9.0, 0.0, 1.0));
  }

  col += vec3(0.30, 0.36, 0.95) * glow * 0.85;
  col += vec3(0.13, 0.83, 0.93) * glow * 0.32;
  col *= mix(0.42, 1.0, smoothstep(1.55, 0.10, length(uv)));

  gl_FragColor = vec4(col * u_intensity, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // The core is this page's centrepiece — a silent no-op here would look like
    // a styling bug, so always surface the driver's compile log.
    console.error("[CoreCanvas] shader compile failed:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function CoreCanvas({
  stateRef,
  className = "",
}: {
  /** Live camera/ring state. Omit for the hero's self-animating reveal. */
  stateRef?: React.MutableRefObject<CoreState>;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();

  // Keep the latest ref in a stable box so the GL effect never re-runs.
  const externalRef = useRef(stateRef);
  externalRef.current = stateRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", {
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // parent's dark bg shows through — graceful no-op

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[CoreCanvas] program link failed:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Marks a successfully running core for verification tooling.
    canvas.dataset.coreReady = "1";

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uScroll = gl.getUniformLocation(prog, "u_scroll");
    const uStage = gl.getUniformLocation(prog, "u_stage");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");

    // Raymarching is fragment-bound, so render below native res — the core is
    // all soft gradients and the difference is invisible at these scales.
    const SCALE = 0.55;
    const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.4);

    function resize() {
      if (!canvas) return;
      const w = Math.max(1, Math.floor(canvas.clientWidth * DPR * SCALE));
      const h = Math.max(1, Math.floor(canvas.clientHeight * DPR * SCALE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl!.viewport(0, 0, w, h);
      }
    }
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0, y: 0 };
    const mouseTarget = { x: 0, y: 0 };
    function onPointer(e: PointerEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      mouseTarget.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseTarget.y = 1 - ((e.clientY - r.top) / r.height) * 2;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let running = true;
    let intensity = 0;
    let stage = 0;
    let scroll = 0;
    const start = performance.now();

    function draw(time: number, st: number, sc: number, mx: number, my: number, inten: number) {
      resize();
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, time);
      gl!.uniform2f(uMouse, mx, my);
      gl!.uniform1f(uScroll, sc);
      gl!.uniform1f(uStage, st);
      gl!.uniform1f(uIntensity, inten);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      if (!running) return;
      const t = (now - start) / 1000;

      // Hero mode (no external state): rings dock themselves over ~3s and the
      // camera drifts slowly, so the core is alive before any scrolling happens.
      const ext = externalRef.current?.current;
      const targetStage = ext ? ext.stage : Math.min(2.4, t * 0.85);
      const targetScroll = ext ? ext.scroll : Math.min(0.18, t * 0.012);

      stage += (targetStage - stage) * 0.08;
      scroll += (targetScroll - scroll) * 0.09;
      mouse.x += (mouseTarget.x - mouse.x) * 0.055;
      mouse.y += (mouseTarget.y - mouse.y) * 0.055;
      intensity += (1 - intensity) * 0.035;

      draw(t, stage, scroll, mouse.x, mouse.y, intensity);
      raf = requestAnimationFrame(frame);
    }

    if (reduced) {
      // One static, pleasant frame — fully assembled, no motion.
      draw(9.0, 5.0, 0.32, 0, 0, 1);
      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onPointer);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    // Never burn GPU on an offscreen canvas or a hidden tab.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`h-full w-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
