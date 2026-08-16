import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Monad Improvement Proposals (MIPs), Explained | MIP Land",
  description:
    "Explore interactive, plain-language explainers for Monad Improvement Proposals, including MIP-3, MIP-4, MIP-7, MIP-8, and MIP-12.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Monad Improvement Proposals (MIPs), Explained | MIP Land",
    description:
      "Explore interactive, plain-language explainers for Monad Improvement Proposals through visualizations, calculators, and real examples.",
    url: "/",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${absoluteUrl("/")}#website`,
      url: absoluteUrl("/"),
      name: "MIP Land",
      description:
        "Interactive, plain-language explainers for Monad Improvement Proposals and blockchain research.",
      inLanguage: ["en", "zh"],
      publisher: { "@id": `${absoluteUrl("/about")}#maintainer` },
    },
    {
      "@type": "Person",
      "@id": `${absoluteUrl("/about")}#maintainer`,
      name: "port",
      url: absoluteUrl("/about"),
      sameAs: ["https://x.com/port_dev"],
    },
    {
      "@type": "CollectionPage",
      "@id": `${absoluteUrl("/")}#collection`,
      url: absoluteUrl("/"),
      name: "Monad Improvement Proposals, explained visually",
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          ["MIP-8: Page-ified Storage", "/mip-8"],
          ["MIP-3: Linear Memory", "/mip-3"],
          ["MIP-4: Reserve Balance Introspection", "/mip-4"],
          ["MIP-7: Extension Opcodes", "/mip-7"],
          ["MIP-12: Decrease Vote Pace", "/mip-12"],
        ].map(([name, path], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          url: absoluteUrl(path),
        })),
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeContent />
    </>
  );
}
