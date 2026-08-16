import type { Metadata } from "next";
import BteHeroSection from "@/components/btx/BteHeroSection";
import WhatIsBteSection from "@/components/btx/WhatIsBteSection";
import EncryptedMempoolSection from "@/components/btx/EncryptedMempoolSection";
import ComparisonSection from "@/components/btx/ComparisonSection";
import PropertiesSection from "@/components/btx/PropertiesSection";
import ConstructionSection from "@/components/btx/ConstructionSection";
import BenchmarksSection from "@/components/btx/BenchmarksSection";
import BteFooterSection from "@/components/btx/BteFooterSection";

export const metadata: Metadata = {
  title: "BTX: Batched Threshold Encryption",
  description:
    "An interactive overview of BTX, Category Labs' new Batched Threshold Encryption scheme. Shortest ciphertext, collision-free, epochless, and fast enough for encrypted mempools.",
  alternates: { canonical: "/btx" },
  openGraph: {
    title: "BTX: Batched Threshold Encryption",
    description:
      "Category Labs' new BTE scheme: shortest ciphertext, collision-free, epochless, and fast enough for encrypted mempools.",
    url: "/btx",
  },
};

export default function BtePage() {
  return (
    <main>
      <BteHeroSection />
      <WhatIsBteSection />
      <EncryptedMempoolSection />
      <ComparisonSection />
      <PropertiesSection />
      <ConstructionSection />
      <BenchmarksSection />
      <BteFooterSection />
    </main>
  );
}
