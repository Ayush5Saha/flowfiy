"use client";

import { useEffect } from "react";
import { RoutcoreHeader } from "./RoutcoreHeader";
import { Hero } from "./Hero";
import { TrustStrip } from "./TrustStrip";
import { Problem } from "./Problem";
import { Services } from "./Services";
import { Systems } from "./Systems";
import { Comparison } from "./Comparison";
import { Scoping } from "./Scoping";
import { Process } from "./Process";
import { Commitments } from "./Commitments";
import { FAQ } from "./FAQ";
import { Contact } from "./Contact";
import { RoutcoreFooter } from "./RoutcoreFooter";

/**
 * v2: a light, calm, consultancy-grade page in Routcore's own navy + teal
 * palette (rc-* colours). The rest of the site is dark; this page overrides
 * the body background and restores it on unmount so navigating away doesn't
 * leave the site stuck in light mode.
 */
export function RoutcorePage() {
  useEffect(() => {
    const previousBg = document.body.style.backgroundColor;
    const previousScroll = document.documentElement.style.scrollBehavior;
    document.body.style.backgroundColor = "#FFFFFF";
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.body.style.backgroundColor = previousBg;
      document.documentElement.style.scrollBehavior = previousScroll;
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-white font-sans text-rc-body antialiased"
      style={{ colorScheme: "light" }}
    >
      <RoutcoreHeader />
      <Hero />
      <TrustStrip />
      <Problem />
      <Services />
      <Systems />
      <Comparison />
      <Scoping />
      <Process />
      <Commitments />
      <FAQ />
      <Contact />
      <RoutcoreFooter />
    </div>
  );
}
