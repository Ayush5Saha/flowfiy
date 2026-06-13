"use client";

// WebGL fragment-shader aurora — domain-warped flow noise in the Flowfiy palette,
// reactive to the cursor, animated on a slow clock. Pure raw WebGL (no three.js).
// Degrades safely: if the GL context can't be created or reduced-motion is set,
// it renders a single static frame (or nothing) over the parent's dark bg.

import { useEffect, useRef } from "react";
import { useReducedMotionSafe } from "./motion";

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;     // normalized, 0..1
uniform float u_intensity;

float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  float aspect = u_res.x / u_res.y;
  vec2 p = uv; p.x *= aspect;
  float t = u_time * 0.045;

  // domain warp — gives the flowing aurora ribbons their organic motion
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  vec2 r = vec2(
    fbm(p + 3.5*q + vec2(1.7, 9.2) + 0.15*t),
    fbm(p + 3.5*q + vec2(8.3, 2.8) - 0.12*t)
  );
  float f = fbm(p + 2.4*r);

  vec2 m = u_mouse; m.x *= aspect;
  float md = distance(p, m);
  float glow = smoothstep(0.55, 0.0, md);

  float band = smoothstep(0.18, 0.92, f + 0.22*r.x);

  vec3 deep   = vec3(0.012, 0.012, 0.020);
  vec3 indigo = vec3(0.388, 0.400, 0.945);
  vec3 violet = vec3(0.545, 0.361, 0.965);
  vec3 cyan   = vec3(0.133, 0.827, 0.933);

  vec3 col = deep;
  col = mix(col, indigo, band * 0.55);
  col = mix(col, violet, smoothstep(0.42, 1.0, f) * 0.55);
  col += cyan * pow(glow, 2.0) * 0.30;        // cyan "signal" pooling at the cursor
  col += violet * glow * 0.22;

  float vig = smoothstep(1.25, 0.15, length(uv - 0.5));
  col *= mix(0.55, 1.0, vig);

  gl_FragColor = vec4(col * u_intensity, 1.0);
}`;

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function ShaderField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGLRenderingContext | null) ||
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Full-screen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");

    // Soft-render scale — the aurora is low-frequency, so 0.6× resolution is
    // indistinguishable and keeps the fragment-heavy shader cheap.
    const SCALE = 0.6;
    const DPR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5);

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

    // Smoothed, normalized cursor — starts right-of-centre to seed the hero scene.
    const mouse = { x: 0.62, y: 0.55 };
    const target = { x: 0.62, y: 0.55 };
    function onPointer(e: PointerEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = 1.0 - (e.clientY - r.top) / r.height; // GL y is up
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let running = true;
    let intensity = 0;
    const start = performance.now();

    function frame(now: number) {
      if (!running) return;
      resize();
      mouse.x += (target.x - mouse.x) * 0.06;
      mouse.y += (target.y - mouse.y) * 0.06;
      intensity += (1 - intensity) * 0.03; // gentle fade-in on mount
      const t = (now - start) / 1000;
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uIntensity, intensity);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    }

    function renderStatic() {
      resize();
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, 12.0); // a pleasant fixed phase
      gl!.uniform2f(uMouse, 0.62, 0.55);
      gl!.uniform1f(uIntensity, 1.0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    if (reduced) {
      renderStatic();
    } else {
      // Pause when offscreen or tab hidden — never burn GPU on an unseen canvas.
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
    }

    return () => {
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
