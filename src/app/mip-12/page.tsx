import type { Metadata } from "next";
import Mip12HeroSection from "@/components/mip12/Mip12HeroSection";
import ParameterChangesSection from "@/components/mip12/ParameterChangesSection";
import WhyProportionalSection from "@/components/mip12/WhyProportionalSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-12: Decrease Block Time",
  description:
    "MIP-12 is Final and its 400ms to 300ms target vote pace activated on Monad mainnet. Explore the exact parameter changes and their effects on capacity and rewards.",
  alternates: { canonical: "/mip-12" },
  openGraph: {
    title: "MIP-12: Decrease Block Time",
    description:
      "MIP-12 is Final and its 400ms to 300ms target vote pace activated on Monad mainnet. Explore the exact parameter changes and their effects on capacity and rewards.",
    url: "/mip-12",
  },
};

export default function Mip12Page() {
  return (
    <main>
      <Mip12HeroSection />
      <ParameterChangesSection />
      <WhyProportionalSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
