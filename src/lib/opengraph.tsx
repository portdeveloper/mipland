import { ImageResponse } from "next/og";

interface OpenGraphImageOptions {
  eyebrow: string;
  title: string;
  description: string;
  accent?: string;
}

export const openGraphImageSize = { width: 1200, height: 630 };

export function createOpenGraphImage({
  eyebrow,
  title,
  description,
  accent = "#2a7d6a",
}: OpenGraphImageOptions): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f6f3",
          color: "#1a1714",
          padding: "68px 76px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "5px",
              background: accent,
            }}
          />
          <div
            style={{
              color: "#746b62",
              fontSize: "24px",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "990px" }}>
          <div
            style={{
              fontSize: title.length > 38 ? "62px" : "76px",
              fontWeight: 700,
              lineHeight: 1.03,
              letterSpacing: "-2px",
              marginBottom: "28px",
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "#6b6259",
              fontSize: "28px",
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#9b9289",
            fontSize: "20px",
          }}
        >
          <span>MIP Land</span>
          <span>mipland.com</span>
        </div>
      </div>
    ),
    openGraphImageSize,
  );
}
