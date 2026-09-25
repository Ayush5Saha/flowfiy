"use client";

import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { Grain } from "@/components/landing/v2/motion";
import { SmoothScroll } from "@/components/landing/v2/SmoothScroll";
import { Cursor } from "@/components/landing/v2/Cursor";

import { RoutcoreHero } from "./RoutcoreHero";
import { Manifesto } from "./Manifesto";
import { Challenge } from "./Challenge";
import { AreasAccordion } from "./AreasAccordion";
import { SystemsGrid } from "./SystemsGrid";
import { TheTest } from "./TheTest";
import { Outcomes } from "./Outcomes";
import { Process } from "./Process";
import { ProvideExpect } from "./ProvideExpect";
import { RoutcoreFAQ } from "./RoutcoreFAQ";
import { TalkMarquee } from "./TalkMarquee";
import { RoutcoreContact } from "./RoutcoreContact";

export function RoutcorePage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#030305] antialiased">
        <Grain />
        <Cursor />
        <MarketingNav />

        {/* Anchors: #hero #about #leaks #areas #systems #test #outcomes
            #process #promise #faq #contact */}
        <RoutcoreHero />
        <Manifesto />
        <Challenge />
        <AreasAccordion />
        <SystemsGrid />
        <TheTest />
        <Outcomes />
        <Process />
        <ProvideExpect />
        <RoutcoreFAQ />
        <TalkMarquee />
        <RoutcoreContact />

        <MarketingFooter showProductCta={false} />
      </div>
    </SmoothScroll>
  );
}
