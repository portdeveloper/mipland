import type { Metadata } from "next";
import Mip15HeroSection from "@/components/mip15/Mip15HeroSection";
import AdoptedEipsSection from "@/components/mip15/AdoptedEipsSection";
import TransferLogsSection from "@/components/mip15/TransferLogsSection";
import AccessListCostSection from "@/components/mip15/AccessListCostSection";
import SkippedEipsSection from "@/components/mip15/SkippedEipsSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-15: Glamsterdam EIP Activation",
  description:
    "MIP-15 is in Review. See the six Glamsterdam EIPs Monad plans to adopt, what each changes for contracts, wallets and indexers, and why Monad leaves the rest out.",
  alternates: { canonical: "/mip-15" },
  openGraph: {
    title: "MIP-15: Glamsterdam EIP Activation",
    description:
      "MIP-15 is in Review. See the six Glamsterdam EIPs Monad plans to adopt, what each changes for contracts, wallets and indexers, and why Monad leaves the rest out.",
    url: "/mip-15",
  },
};

export default function Mip15Page() {
  return (
    <main>
      <Mip15HeroSection />
      <AdoptedEipsSection />
      <TransferLogsSection />
      <AccessListCostSection />
      <SkippedEipsSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
