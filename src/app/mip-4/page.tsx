import type { Metadata } from "next";
import Mip4HeroSection from "@/components/mip4/Mip4HeroSection";
import AsyncPipelineSection from "@/components/mip4/AsyncPipelineSection";
import BundlerComparisonSection from "@/components/mip4/BundlerComparisonSection";
import TransactionTimelineSection from "@/components/mip4/TransactionTimelineSection";
import Mip4DetailsSection from "@/components/mip4/Mip4DetailsSection";
import SuggestionsSection from "@/components/SuggestionsSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-4: Reserve Balance Introspection",
  description:
    "An interactive explainer for MIP-4: detecting reserve balance violations mid-execution",
  openGraph: {
    title: "MIP-4: Reserve Balance Introspection",
    description:
      "An interactive explainer for MIP-4: detecting reserve balance violations mid-execution",
  },
};

export default function Mip4Page() {
  return (
    <main>
      <Mip4HeroSection />
      <AsyncPipelineSection />
      <BundlerComparisonSection />
      <TransactionTimelineSection />
      <Mip4DetailsSection />
      <SuggestionsSection mip="mip-4" />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
