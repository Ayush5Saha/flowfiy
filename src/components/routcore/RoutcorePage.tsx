"use client";

import { MarketingNav } from "@/components/landing/MarketingNav";
import { MarketingFooter } from "@/components/landing/MarketingFooter";
import { Grain } from "@/components/landing/v2/motion";
import { SmoothScroll } from "@/components/landing/v2/SmoothScroll";
import { Cursor } from "@/components/landing/v2/Cursor";

import { RoutcoreHero } from "./RoutcoreHero";
import { Challenge } from "./Challenge";
import { CoreStory } from "./CoreStory";
import { Deliverables } from "./Deliverables";
import { Timeline } from "./Timeline";
import { PricingRoutcore } from "./PricingRoutcore";
import { ProvideExpect } from "./ProvideExpect";
import { WhyUs } from "./WhyUs";
import { RoutcoreFAQ } from "./RoutcoreFAQ";
import { RoutcoreContact } from "./RoutcoreContact";

export function RoutcorePage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#030305] antialiased">
        <Grain />
        <Cursor />
        <MarketingNav />

        {/* Anchors: #hero · #challenge · #how-it-works · #included · #timeline
            #pricing · #scope · #why-us · #faq · #contact */}
        <RoutcoreHero />
        <Challenge />
        <CoreStory />
        <Deliverables />
        <Timeline />
        <PricingRoutcore />
        <ProvideExpect />
        <WhyUs />
        <RoutcoreFAQ />
        <RoutcoreContact />

        <MarketingFooter />
      </div>
    </SmoothScroll>
  );
}
