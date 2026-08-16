import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "Spam MEV: Blockspace Under Pressure";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Category Labs Research",
    title: "Spam MEV: Blockspace Under Pressure",
    description: "Explore the equilibrium behind speculative on-chain spam.",
    accent: "#c4653a",
  });
}
