import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "Clear Signing on Monad";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Interactive Demo",
    title: "Clear Signing on Monad",
    description: "Turn opaque transaction hex into a human-readable wallet view.",
  });
}
