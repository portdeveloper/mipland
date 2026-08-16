import type { Metadata } from "next";
import { ExplainModeProvider } from "@/components/spam-mev/ExplainModeContext";
import ModeToggle from "@/components/spam-mev/ModeToggle";
import SpamHeroSection from "@/components/spam-mev/SpamHeroSection";
import WhatIsMevSection from "@/components/spam-mev/WhatIsMevSection";
import WhatIsSpamSection from "@/components/spam-mev/WhatIsSpamSection";
import EquilibriumSection from "@/components/spam-mev/EquilibriumSection";
import DesignLeversSection from "@/components/spam-mev/DesignLeversSection";
import SpamFooterSection from "@/components/spam-mev/SpamFooterSection";

export const metadata: Metadata = {
  title: "Spam MEV: Blockspace Under Pressure",
  description:
    "An interactive explainer for the Spam MEV equilibrium model. Explore how block capacity, gas price floors, and transaction ordering shape spam volumes on high-throughput blockchains.",
  alternates: { canonical: "/spam-mev" },
  openGraph: {
    title: "Spam MEV: Blockspace Under Pressure",
    description:
      "An interactive explainer for the Spam MEV equilibrium model. Explore how block capacity, gas price floors, and transaction ordering shape spam volumes.",
    url: "/spam-mev",
  },
};

export default function SpamMevPage() {
  return (
    <ExplainModeProvider>
      <ModeToggle />
      <main>
        <SpamHeroSection />
        <WhatIsMevSection />
        <WhatIsSpamSection />
        <EquilibriumSection />
        <DesignLeversSection />
        <SpamFooterSection />
      </main>
    </ExplainModeProvider>
  );
}
