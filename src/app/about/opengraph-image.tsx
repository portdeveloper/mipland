import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "About MIP Land";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "About",
    title: "Making protocol changes easier to understand",
    description: "Independent, interactive education for the Monad community.",
  });
}
