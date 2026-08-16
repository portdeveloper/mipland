import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "Monad 101: A Visual Primer";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Visual Primer",
    title: "Monad 101",
    description: "Compatibility, consensus, execution, propagation, and storage for EVM developers.",
  });
}
