"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
  useMotionValue,
  useMotionTemplate,
} from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Star, ChevronDown, Menu, X } from "lucide-react";

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 z-[100] origin-left"
      style={{ scaleX }}
    />
  );
}

// ─── Particle Neural Network Canvas ──────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const mouse = { x: -9999, y: -9999 };

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; pulse: number; pulseSpeed: number };
    const particles: Particle[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0 || p.x > W()) p.vx *= -1;
        if (p.y < 0 || p.y > H()) p.vy *= -1;

        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 100) {
          p.x += (mdx / mdist) * 1.5;
          p.y += (mdy / mdist) * 1.5;
        }

        const alpha = 0.4 + 0.3 * Math.sin(p.pulse);
        const radius = p.r * (1 + 0.3 * Math.sin(p.pulse));

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
        grd.addColorStop(0, `rgba(139, 92, 246, ${alpha})`);
        grd.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha + 0.2})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const grd = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
            grd.addColorStop(0, `rgba(99, 102, 241, ${alpha})`);
            grd.addColorStop(0.5, `rgba(139, 92, 246, ${alpha * 1.5})`);
            grd.addColorStop(1, `rgba(99, 102, 241, ${alpha})`);
            ctx.strokeStyle = grd;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-60"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// ─── Floating Orb (scroll-driven parallax) ────────────────────────────────────

function FloatingOrb({
  size,
  color,
  x,
  top,
  speedY,
  blur = 80,
}: {
  size: number;
  color: string;
  x: string;
  top: string;
  speedY: number;
  blur?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const yRaw = useTransform(scrollY, [0, 3000], [0, speedY]);
  const y = useSpring(yRaw, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      ref={ref}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: x,
        top,
        y,
        background: color,
        filter: `blur(${blur}px)`,
        opacity: 0.25,
      }}
    />
  );
}

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -10, y: dx * 10 });
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const spotlightBg = useMotionTemplate`radial-gradient(200px circle at ${useMotionValue(spotlight.x)}px ${useMotionValue(spotlight.y)}px, rgba(139,92,246,0.08), transparent 80%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovering(false); }}
      animate={{ rotateX: tilt.x, rotateY: tilt.y, scale: hovering ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
        style={{ background: spotlightBg }}
      />
      {children}
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Section Fade In ──────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const RESOURCES_LINKS = [
  { label: "Blog", href: "/blog", desc: "AI sales tips & guides" },
  { label: "AI Lead Generation", href: "/use-cases/ai-lead-generation", desc: "Use case deep dive" },
  { label: "Cold Email Automation", href: "/use-cases/cold-email-automation", desc: "Automate outreach" },
  { label: "About", href: "/about", desc: "Our story & mission" },
];

const COMPARE_LINKS = [
  { label: "Flowfiy vs Clay", href: "/vs/clay", desc: "Workflow builder vs AI pipeline" },
  { label: "Flowfiy vs Apollo", href: "/vs/apollo", desc: "Database vs end-to-end platform" },
];

function NavDropdown({ label, items }: { label: string; items: { label: string; href: string; desc: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
        {label} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 hover:bg-white/5 transition-colors"
                onClick={() => setOpen(false)}
              >
                <p className="text-sm text-white font-medium">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    return scrollY.on("change", (v) => setScrolled(v > 20));
  }, [scrollY]);

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.svg" alt="Flowfiy" width={110} height={32} priority />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
            <a key={href} href={href} className="text-sm text-zinc-400 hover:text-white transition-colors">
              {label}
            </a>
          ))}
          <NavDropdown label="Resources" items={RESOURCES_LINKS} />
          <NavDropdown label="Compare" items={COMPARE_LINKS} />
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1.5">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-all hover:shadow-lg hover:shadow-primary/25"
          >
            Get started free
          </Link>
        </div>

        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 border-b border-white/10 px-4 pb-4 space-y-1"
          >
            {[["Features", "#features"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm text-zinc-300 hover:text-white">
                {label}
              </a>
            ))}
            <p className="text-xs text-zinc-600 uppercase tracking-widest pt-3 pb-1">Resources</p>
            {RESOURCES_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
                {item.label}
              </Link>
            ))}
            <p className="text-xs text-zinc-600 uppercase tracking-widest pt-2 pb-1">Compare</p>
            {COMPARE_LINKS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-zinc-300 hover:text-white">
                {item.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" className="text-sm text-center py-2.5 border border-white/10 rounded-lg text-zinc-300">Sign in</Link>
              <Link href="/signup" className="text-sm text-center py-2.5 bg-primary rounded-lg text-white font-medium">Get started free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Hero text parallax
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Dashboard 3D scroll morph
  const dashRotateX = useTransform(scrollYProgress, [0, 0.6], [8, 28]);
  const dashY = useTransform(scrollYProgress, [0, 0.6], [0, -80]);
  const dashScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.85]);
  const dashOpacity = useTransform(scrollYProgress, [0.3, 0.65], [1, 0]);

  // Smooth springs for dashboard
  const springRotateX = useSpring(dashRotateX, { stiffness: 60, damping: 20 });
  const springY = useSpring(dashY, { stiffness: 60, damping: 20 });
  const springScale = useSpring(dashScale, { stiffness: 60, damping: 20 });

  // Ambient glow parallax
  const glow1Y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const glow2Y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const glow3Y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030305]"
    >
      {/* Particle canvas */}
      <div className="absolute inset-0">
        <ParticleCanvas />
      </div>

      {/* Parallax ambient glows */}
      <motion.div
        style={{ y: glow1Y }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        style={{ y: glow2Y }}
        className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        style={{ y: glow3Y }}
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[100px] pointer-events-none"
      />

      {/* Hero text — parallax up on scroll */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-32 pb-12"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by Claude AI · BYOK · Zero per-lead cost
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.05]"
        >
          Turn Any Market{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Into Pipeline
            </span>
            <motion.span
              className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-violet-500/0 via-violet-500 to-violet-500/0"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
            />
          </span>
          <br />On Autopilot.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          5 specialized AI agents research your ICP, find matching leads, qualify every prospect,
          and write hyper-personalized outreach — delivered to Gmail, at scale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 bg-primary rounded-xl text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <span>Start for free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 text-zinc-300 font-medium text-sm hover:border-white/20 hover:text-white transition-all hover:-translate-y-0.5"
          >
            See how it works
            <ChevronDown className="w-4 h-4" />
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-zinc-600 mt-6"
        >
          No credit card required · 50 free lead generations · Cancel anytime
        </motion.p>
      </motion.div>

      {/* 3D Dashboard — scroll-driven tilt + depth */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 1400 }}
        className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pb-20"
      >
        <motion.div
          style={{
            rotateX: springRotateX,
            y: springY,
            scale: springScale,
            opacity: dashOpacity,
            transformStyle: "preserve-3d",
          }}
          className="relative mx-auto"
        >
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-primary/20 blur-3xl rounded-full" />

          {/* Browser chrome */}
          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/60">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-zinc-950/50">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <div className="flex-1 mx-4">
                <div className="bg-zinc-800/60 rounded-md px-3 py-1 text-xs text-zinc-500 text-center">
                  app.Flowfiy.com/dashboard
                </div>
              </div>
            </div>

            <div className="flex" style={{ minHeight: 340 }}>
              <div className="w-44 border-r border-white/5 bg-zinc-950/60 p-3 flex flex-col gap-1 shrink-0">
                <div className="flex items-center gap-2 px-2 py-2 mb-3">
                  <Image src="/icon.svg" alt="Flowfiy" width={22} height={22} className="rounded-md" />
                  <span className="text-xs font-bold text-white">Flowfiy</span>
                </div>
                {["Dashboard", "Leads", "Campaigns", "Integrations"].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${i === 0 ? "bg-primary/20 text-primary font-medium" : "text-zinc-500"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex-1 p-5 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-white">Dashboard</p>
                    <p className="text-[10px] text-zinc-500">Welcome back — your outbound overview</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-medium">
                    + Generate Leads
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[["1,247", "Leads Generated"], ["389", "Qualified"], ["214", "Emails Sent"], ["12", "Meetings"]].map(([val, label]) => (
                    <div key={label} className="bg-zinc-800/50 rounded-lg p-2.5 border border-white/5">
                      <p className="text-sm font-bold text-white font-mono">{val}</p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {[
                    { name: "Sarah Chen", role: "VP Engineering · Streamline Labs", score: 87 },
                    { name: "Marcus Rivera", role: "CTO · Nexus AI", score: 91 },
                    { name: "Priya Sharma", role: "Head of Eng · FinFlow", score: 73 },
                  ].map((lead) => (
                    <div key={lead.name} className="flex items-center justify-between bg-zinc-800/40 rounded-lg px-3 py-2 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                          {lead.name[0]}
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-white">{lead.name}</p>
                          <p className="text-[9px] text-zinc-500">{lead.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-violet-400">{lead.score}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">Qualified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const stats = [
    { value: 275, suffix: "M+", label: "Contacts in Apollo DB" },
    { value: 5, suffix: "x", label: "Faster lead research" },
    { value: 87, suffix: "%", label: "Avg qualification accuracy" },
    { value: 0, suffix: "$", label: "Claude API cost to you" },
  ];

  return (
    <section ref={ref} className="relative bg-[#030305] border-y border-white/5 py-14 overflow-hidden">
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-gradient-to-r from-violet-900/5 via-purple-900/10 to-indigo-900/5"
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-white/5">
          {stats.map(({ value, suffix, label }, i) => (
            <FadeIn key={label} delay={i * 0.1} className="text-center px-6">
              <p className="text-4xl font-bold font-mono text-white mb-1">
                {suffix === "$" ? (
                  <span>$<Counter value={value} /></span>
                ) : (
                  <Counter value={value} suffix={suffix} />
                )}
              </p>
              <p className="text-sm text-zinc-500">{label}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function StepCard({ step, index }: { step: { num: string; icon: string; title: string; desc: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.4"],
  });
  const rotateY = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -30 : 30, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -40 : 40, 0]);
  const springRotateY = useSpring(rotateY, { stiffness: 80, damping: 20 });
  const springX = useSpring(x, { stiffness: 80, damping: 20 });

  return (
    <div ref={ref} className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
      <motion.div
        style={{ rotateY: springRotateY, x: springX, opacity, perspective: 1200, transformStyle: "preserve-3d" }}
        className={`flex-1 ${index % 2 === 1 ? "md:text-right" : ""}`}
      >
        <TiltCard className="inline-block w-full">
          <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/8 rounded-2xl p-6 hover:border-violet-500/30 transition-colors group">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{step.icon}</span>
              <span className="text-xs font-mono text-violet-400">{step.num}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{step.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{step.desc}</p>
          </div>
        </TiltCard>
      </motion.div>

      <div className="hidden md:flex shrink-0 w-12 h-12 rounded-full bg-zinc-900 border-2 border-violet-500/50 items-center justify-center text-lg z-10 shadow-lg shadow-violet-500/10">
        {step.icon}
      </div>

      <div className="flex-1 hidden md:block" />
    </div>
  );
}

function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineScaleY = useTransform(scrollYProgress, [0.05, 0.9], [0, 1]);
  const springLine = useSpring(lineScaleY, { stiffness: 40, damping: 15 });

  const steps = [
    { num: "01", icon: "🧠", title: "ICP Analyzer", desc: "Claude maps your ideal customer profile — industries, titles, company size, pain points — into a precise targeting signal." },
    { num: "02", icon: "🔍", title: "Lead Discovery", desc: "Apollo's 275M+ contact database is searched with AI-constructed filters. Matching prospects are pulled in seconds." },
    { num: "03", icon: "🕷️", title: "Company Research", desc: "Apify scrapes each company's website, extracts signals, and builds a live context snapshot for each lead." },
    { num: "04", icon: "⚡", title: "AI Qualification", desc: "Every lead is scored 0–100. Only high-fit prospects move forward — no wasted outreach on dead-end contacts." },
    { num: "05", icon: "✉️", title: "Personalized Outreach", desc: "Claude writes a subject line, email body, and two follow-ups for each qualified lead — using their actual company context." },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-[#030305] py-28 px-4 sm:px-6 overflow-hidden">
      {/* Floating orbs */}
      <FloatingOrb size={400} color="radial-gradient(circle, rgba(109,40,217,1), rgba(79,70,229,0))" x="-10%" top="10%" speedY={-120} blur={100} />
      <FloatingOrb size={300} color="radial-gradient(circle, rgba(139,92,246,1), rgba(99,102,241,0))" x="80%" top="60%" speedY={80} blur={120} />

      <div className="max-w-6xl mx-auto relative">
        <FadeIn className="text-center mb-20">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">The Pipeline</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">5 agents. One pipeline.</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Each agent is specialized. Each step feeds the next. The entire pipeline runs while you sleep.</p>
        </FadeIn>

        <div className="relative">
          {/* Scroll-driven connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 hidden md:block" style={{ transform: "translateX(-0.5px)" }}>
            <motion.div
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-violet-500 via-purple-500 to-indigo-500 origin-top"
              style={{ scaleY: springLine, height: "100%" }}
            />
          </div>

          <div className="space-y-16 md:space-y-20">
            {steps.map((step, i) => (
              <StepCard key={step.num} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

function FeatureCard({ f, index }: { f: { icon: string; title: string; desc: string }; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.4"],
  });
  // Each card floats in from a slightly different depth
  const depths = [60, 40, 80, 50, 70, 45];
  const yStart = depths[index % depths.length];
  const y = useTransform(scrollYProgress, [0, 1], [yStart, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
  const springY = useSpring(y, { stiffness: 70, damping: 18 });

  return (
    <motion.div ref={ref} style={{ y: springY, opacity }}>
      <TiltCard className="h-full">
        <div className="relative h-full bg-zinc-900/40 border border-white/6 rounded-2xl p-6 group hover:border-violet-500/30 transition-all duration-300 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 to-indigo-600/0 group-hover:from-violet-600/5 group-hover:to-indigo-600/5 transition-all duration-500 rounded-2xl" />
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-white/8 flex items-center justify-center text-xl mb-4 group-hover:border-violet-500/30 transition-colors">
              {f.icon}
            </div>
            <h3 className="font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">{f.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

function Features() {
  const features = [
    { icon: "🔐", title: "BYOK — Zero Platform Cost", desc: "Bring your own Claude API key. Every token billed directly to your Anthropic account. Flowfiy charges only for platform access — not per generation." },
    { icon: "🏢", title: "Multi-Tenant Workspaces", desc: "Invite your whole team. Owner, admin, and member roles with full isolation. Each workspace has its own ICP, leads, and campaigns." },
    { icon: "📊", title: "Lead Qualification Scoring", desc: "Every lead receives a 0–100 qualification score with reasoning. Filter, sort, and focus only on the prospects that will actually convert." },
    { icon: "✏️", title: "Editable AI Copy", desc: "Claude writes the first draft. You own the final version. Edit, regenerate, or approve outreach copy before a single email is sent." },
    { icon: "📧", title: "Gmail-Native Delivery", desc: "Emails send from your own inbox via OAuth. No shared IP pools, no domain warm-up, no deliverability headaches. Full reply tracking." },
    { icon: "🔒", title: "AES-256 Encrypted Credentials", desc: "Every API key and OAuth token is encrypted at rest with AES-256-GCM. Your keys never appear in logs. Your data never leaves your control." },
  ];

  return (
    <section id="features" className="relative bg-[#030305] py-28 px-4 sm:px-6 overflow-hidden">
      {/* Decorative top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

      {/* Floating orbs */}
      <FloatingOrb size={500} color="radial-gradient(circle, rgba(79,70,229,0.6), rgba(139,92,246,0))" x="60%" top="20%" speedY={100} blur={130} />
      <FloatingOrb size={350} color="radial-gradient(circle, rgba(139,92,246,0.5), rgba(109,40,217,0))" x="-5%" top="50%" speedY={-60} blur={110} />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">Built Different</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Everything you need,<br />nothing you don&apos;t.</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Built for revenue teams who want precision, not volume. Quality over quantity — always.</p>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} f={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

import { getLocalisedPrice } from "@/lib/currency";

function Pricing() {
  const [country, setCountry] = useState<string>("IN");

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d: { country?: string }) => { if (d.country) setCountry(d.country); })
      .catch(() => null);
  }, []);

  const plans = [
    { name: "Free",    priceInr: 0,     desc: "Try it out",       gens: "100/mo",        seats: 1,  features: ["1 campaign", "Gmail integration", "All AI agents", "Community support"],                              cta: "Get started",    highlight: false },
    { name: "Starter", priceInr: 4900,  desc: "Solo founders",    gens: "2,500/mo",       seats: 1,  features: ["5 campaigns", "CSV import", "Email outreach", "Email support"],                                      cta: "Start free trial", highlight: false },
    { name: "Growth",  priceInr: 9900,  desc: "Growing teams",    gens: "7,500/mo",       seats: 5,  features: ["Unlimited campaigns", "Team workspace", "A/B testing", "Priority queue & analytics"],                cta: "Start free trial", highlight: true  },
    { name: "Agency",  priceInr: 24900, desc: "Agencies & scale", gens: "Unlimited",      seats: 20, features: ["Unlimited everything", "20 team seats", "White-label ready", "Dedicated support"],                   cta: "Contact sales",  highlight: false },
  ];

  return (
    <section id="pricing" className="relative bg-[#030305] py-28 px-4 sm:px-6 overflow-hidden">
      <FloatingOrb size={600} color="radial-gradient(circle, rgba(109,40,217,0.4), rgba(79,70,229,0))" x="20%" top="30%" speedY={-80} blur={150} />

      <div className="max-w-6xl mx-auto relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, transparent pricing.</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">Pay for the platform. AI API costs go directly to your Anthropic account — not us.</p>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {plans.map((plan, i) => {
            const lp = getLocalisedPrice(plan.priceInr, country);
            return (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <TiltCard>
                  <div className={`relative rounded-2xl p-6 border transition-all duration-300 ${
                    plan.highlight
                      ? "bg-gradient-to-b from-violet-950/80 to-zinc-900/80 border-violet-500/40 shadow-xl shadow-violet-500/10"
                      : "bg-zinc-900/40 border-white/6 hover:border-white/12"
                  }`}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500 rounded-full text-xs font-semibold text-white whitespace-nowrap">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-5">
                      <p className="font-semibold text-white mb-0.5">{plan.name}</p>
                      <p className="text-xs text-zinc-500">{plan.desc}</p>
                    </div>
                    <div className="mb-5">
                      <span className="text-4xl font-bold font-mono text-white">{lp.formatted}</span>
                      {plan.priceInr > 0 && <span className="text-sm text-zinc-500">/mo</span>}
                      {plan.priceInr > 0 && lp.currency.code !== "INR" && (
                        <p className="text-xs text-zinc-600 mt-0.5">{lp.note}</p>
                      )}
                    </div>
                    <div className="mb-5 p-3 rounded-xl bg-black/20 border border-white/5">
                      <p className="text-xs text-zinc-400"><span className="text-white font-medium">{plan.gens}</span> generations</p>
                      <p className="text-xs text-zinc-400 mt-1"><span className="text-white font-medium">{plan.seats}</span> seat{plan.seats > 1 ? "s" : ""}</p>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                          <Check className={`w-3.5 h-3.5 shrink-0 ${plan.highlight ? "text-violet-400" : "text-zinc-600"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                        plan.highlight
                          ? "bg-violet-500 hover:bg-violet-400 text-white hover:shadow-lg hover:shadow-violet-500/25"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-white/6"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </TiltCard>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const quotes = [
    { text: "We went from 2 hours of manual research per lead to 90 seconds fully automated. The qualification scoring alone saved us from chasing dead-end prospects.", name: "Jordan Blake", role: "Head of Growth, CloudBridge", stars: 5 },
    { text: "The personalization is genuinely impressive. Each email references something specific about the prospect's company. Our reply rate went from 3% to 18% in the first month.", name: "Sarah Chen", role: "VP Engineering, Streamline Labs", stars: 5 },
    { text: "As an agency running outbound for 8 clients, the multi-tenant setup and team seats are exactly what we needed. BYOK model means our margins stay healthy.", name: "Marcus Rivera", role: "Founder, RevOps Agency", stars: 5 },
  ];

  return (
    <section className="bg-[#030305] py-28 px-4 sm:px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center mb-16">
          <span className="text-xs font-medium text-violet-400 tracking-widest uppercase mb-4 block">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Trusted by revenue teams.</h2>
        </FadeIn>
        <div className="grid md:grid-cols-3 gap-5">
          {quotes.map((q, i) => (
            <FadeIn key={q.name} delay={i * 0.1}>
              <TiltCard className="h-full">
                <div className="h-full bg-zinc-900/40 border border-white/6 rounded-2xl p-6 hover:border-violet-500/20 transition-colors">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: q.stars }).map((_, si) => (
                      <Star key={si} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-5">&ldquo;{q.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {q.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">{q.name}</p>
                      <p className="text-xs text-zinc-500">{q.role}</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Box tilts back as it enters, levels as it centers, tilts forward as it exits
  const rotateX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [12, 0, 0, -12]);
  const scale = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.88, 1, 1, 0.92]);
  const springRotateX = useSpring(rotateX, { stiffness: 60, damping: 20 });
  const springScale = useSpring(scale, { stiffness: 60, damping: 20 });

  return (
    <section className="bg-[#030305] py-28 px-4 sm:px-6" style={{ perspective: 1400 }}>
      <FadeIn>
        <motion.div
          ref={ref}
          style={{ rotateX: springRotateX, scale: springScale, transformStyle: "preserve-3d" }}
          className="relative max-w-3xl mx-auto text-center overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-b from-violet-950/40 to-zinc-900/40 p-16"
        >
          {/* Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-violet-600/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-indigo-600/15 blur-3xl" />

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center overflow-hidden"
            >
              <Image src="/icon.svg" alt="" width={44} height={44} />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your pipeline won&apos;t<br />fill itself.
            </h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-md mx-auto">
              Start with 50 free generations. No credit card required. First leads in under 10 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 text-base"
            >
              Start generating leads free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </FadeIn>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Sign up", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
];

function Footer() {
  return (
    <footer className="bg-[#030305] border-t border-white/5 pt-16 pb-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 mb-14">
          {/* Brand */}
          <div className="lg:w-64 shrink-0">
            <Link href="/" className="inline-flex mb-4">
              <Image src="/logo.svg" alt="Flowfiy" width={120} height={36} />
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              AI-powered outbound sales platform. Bring your own Claude key, generate qualified leads, and send hyper-personalized outreach — at scale.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            {FOOTER_LINKS.map(({ heading, links }) => (
              <div key={heading}>
                <p className="font-semibold text-zinc-300 mb-3">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link href={href} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© 2026 Flowfiy. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>Built with Claude AI · Powered by Anthropic</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors hidden sm:inline">
              support@flowfiy.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-[#030305] min-h-screen antialiased">
      <ScrollProgressBar />
      <Navbar />
      <Hero />
      <StatsBar />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}
