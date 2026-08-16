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
import Mip8CollectionsSection from "@/components/Mip8CollectionsSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-8: Page-ified Storage",
  description:
    "An interactive explainer for MIP-8: aligning EVM storage with hardware reality",
  alternates: { canonical: "/mip-8" },
  openGraph: {
    title: "MIP-8: Page-ified Storage",
    description:
      "An interactive explainer for MIP-8: aligning EVM storage with hardware reality",
    url: "/mip-8",
  },
};

export default function Mip8Page() {
  return (
    <main>
      <HeroSection />
      <ComparisonSection />
      <GasCalculatorSection />
      <SuggestionsSection mip="mip-8" />
      <Mip8CollectionsSection />
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
