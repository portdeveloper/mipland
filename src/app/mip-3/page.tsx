import type { Metadata } from "next";
import Mip3HeroSection from "@/components/mip3/Mip3HeroSection";
import CostCurveSection from "@/components/mip3/CostCurveSection";
import Mip3GasCalculatorSection from "@/components/mip3/Mip3GasCalculatorSection";
import MemoryPoolSection from "@/components/mip3/MemoryPoolSection";
import Mip3TakeawaysSection from "@/components/mip3/Mip3TakeawaysSection";
import Mip3CompatibilitySection from "@/components/mip3/Mip3CompatibilitySection";
import SuggestionsSection from "@/components/SuggestionsSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-3: Linear Memory",
  description:
    "An interactive explainer for MIP-3: replacing quadratic memory costs with a linear model",
  openGraph: {
    title: "MIP-3: Linear Memory",
    description:
      "An interactive explainer for MIP-3: replacing quadratic memory costs with a linear model",
  },
};

export default function Mip3Page() {
  return (
    <main>
      <Mip3HeroSection />
      <CostCurveSection />
      <Mip3GasCalculatorSection />
      <SuggestionsSection mip="mip-3" />
      <MemoryPoolSection />
      <Mip3TakeawaysSection />
      <Mip3CompatibilitySection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
