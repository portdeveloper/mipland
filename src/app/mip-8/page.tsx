import type { Metadata } from "next";
import HeroSection from "@/components/HeroSection";
import ComparisonSection from "@/components/ComparisonSection";
import PageMappingSection from "@/components/PageMappingSection";
import GasCalculatorSection from "@/components/GasCalculatorSection";
import CherryPickedSection from "@/components/CherryPickedSection";
import StepperSection from "@/components/StepperSection";
import AnalyzerSection from "@/components/AnalyzerSection";
import TakeawaysSection from "@/components/TakeawaysSection";
import CompatibilitySection from "@/components/CompatibilitySection";
import SuggestionsSection from "@/components/SuggestionsSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-8: Page-ified Storage",
  description:
    "An interactive explainer for MIP-8: aligning EVM storage with hardware reality",
  openGraph: {
    title: "MIP-8: Page-ified Storage",
    description:
      "An interactive explainer for MIP-8: aligning EVM storage with hardware reality",
  },
};

export default function Mip8Page() {
  return (
    <main>
      <HeroSection />
      <ComparisonSection />
      <GasCalculatorSection />
      <SuggestionsSection mip="mip-8" />
      <StepperSection />
      <CherryPickedSection />
      <PageMappingSection />
      <AnalyzerSection />
      <TakeawaysSection />
      <CompatibilitySection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
