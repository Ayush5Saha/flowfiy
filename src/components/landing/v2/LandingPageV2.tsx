"use client";

import { MarketingNav } from "../MarketingNav";
import { MarketingFooter } from "../MarketingFooter";
import { Grain } from "./motion";
import { Hero } from "./Hero";
import { SmoothScroll } from "./SmoothScroll";
import { Cursor } from "./Cursor";
import { StoryScroll } from "./StoryScroll";
import { DemoVideo } from "./DemoVideo";
import { ProofStrip } from "./ProofStrip";
import { FeatureRail } from "./FeatureRail";
import { AlwaysOn } from "./AlwaysOn";
import { PricingV2 } from "./PricingV2";
import { TestimonialsV2 } from "./TestimonialsV2";
import { FinalCTAV2 } from "./FinalCTAV2";

export function LandingPageV2() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-[#030305] antialiased">
        <Grain />
        <Cursor />
        <MarketingNav />
        <Hero />

        {/* Phase B sections — each owns its own anchor id internally:
            StoryScroll #how-it-works · DemoVideo #demo · ProofStrip #proof
            FeatureRail #features · AlwaysOn #always-on · PricingV2 #pricing
            TestimonialsV2 #testimonials · FinalCTAV2 #cta — matching the
            MarketingNav anchors. */}
        <StoryScroll />
        <DemoVideo />
        <ProofStrip />
        <FeatureRail />
        <AlwaysOn />
        <PricingV2 />
        <TestimonialsV2 />
        <FinalCTAV2 />

        <MarketingFooter />
      </div>
    </SmoothScroll>
  );
}
