import { createOpenGraphImage, openGraphImageSize } from "@/lib/opengraph";

export const runtime = "edge";
export const alt = "Monad Infrastructure Playground";
export const size = openGraphImageSize;
export const contentType = "image/png";

export default function Image() {
  return createOpenGraphImage({
    eyebrow: "Builder Tools",
    title: "Monad Infrastructure Playground",
    description: "Try infrastructure tools live, then copy the integration code.",
  });
}
