import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "BTX: Batched Threshold Encryption";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Category Labs Research",
    title: "BTX: Batched Threshold Encryption",
    description: "A practical cryptographic primitive for encrypted mempools.",
  });
}
