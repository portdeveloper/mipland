import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "Asynchronous Execution";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Interactive Explainer",
    title: "Asynchronous Execution",
    description:
      "Consensus decides transaction order while execution runs in a separate, slightly lagged lane.",
    accent: "#3a7ca5",
  });
}
