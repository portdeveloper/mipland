import type { Metadata } from "next";
import Mip12HeroSection from "@/components/mip12/Mip12HeroSection";
import ParameterChangesSection from "@/components/mip12/ParameterChangesSection";
import WhyProportionalSection from "@/components/mip12/WhyProportionalSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-12: Decrease Vote Pace",
  description:
    "A plain-language look at MIP-12: shortening block vote pace from 400ms to 300ms, and what each parameter change actually means.",
  openGraph: {
    title: "MIP-12: Decrease Vote Pace",
    description:
      "A plain-language look at MIP-12: shortening block vote pace from 400ms to 300ms, and what each parameter change actually means.",
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
