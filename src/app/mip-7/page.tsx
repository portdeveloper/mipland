import type { Metadata } from "next";
import Mip7HeroSection from "@/components/mip7/Mip7HeroSection";
import CollisionSection from "@/components/mip7/CollisionSection";
import CollisionProbabilitySection from "@/components/mip7/CollisionProbabilitySection";
import NamespaceSection from "@/components/mip7/NamespaceSection";
import JumpdestSection from "@/components/mip7/JumpdestSection";
import EncodingSection from "@/components/mip7/EncodingSection";
import Mip7TakeawaysSection from "@/components/mip7/Mip7TakeawaysSection";
import DiscussionCtaSection from "@/components/DiscussionCtaSection";
import FooterSection from "@/components/FooterSection";

export const metadata: Metadata = {
  title: "MIP-7: Extension Opcodes",
  description:
    "An interactive explainer for MIP-7: safely expanding the EVM opcode space with a reserved extension namespace",
  alternates: { canonical: "/mip-7" },
  openGraph: {
    title: "MIP-7: Extension Opcodes",
    description:
      "An interactive explainer for MIP-7: safely expanding the EVM opcode space with a reserved extension namespace",
    url: "/mip-7",
  },
};

export default function Mip7Page() {
  return (
    <main>
      <Mip7HeroSection />
      <CollisionSection />
      <CollisionProbabilitySection />
      <NamespaceSection />
      <JumpdestSection />
      <EncodingSection />
      <Mip7TakeawaysSection />
      <DiscussionCtaSection />
      <FooterSection />
    </main>
  );
}
