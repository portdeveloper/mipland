import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "MIP-8 Solidity Storage Layout Analyzer";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Developer Tool",
    title: "Storage Layout Analyzer",
    description: "Analyze Solidity storage layouts and estimate MIP-8 gas savings.",
  });
}
