import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-8: Page-ified Storage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const cols = 16;
  const rows = 4;
  const cellSize = 28;
  const gap = 3;
  const pageStart = 16; // highlight a page region
  const pageEnd = 32;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8f6f3",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            fontWeight: 500,
            color: "#2a7d6a",
            fontFamily: "monospace",
            letterSpacing: "2px",
            marginBottom: "20px",
          }}
        >
          MIP-8
        </div>
        <div
          style={{
            fontSize: "56px",
            fontWeight: 300,
            color: "#1a1714",
            letterSpacing: "-1px",
            marginBottom: "16px",
          }}
        >
          Page-ified Storage
        </div>
        <div
          style={{
            fontSize: "24px",
            fontWeight: 300,
            color: "#6b6259",
            marginBottom: "40px",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: "1.4",
          }}
        >
          Pricing EVM storage by the 4 KB page
        </div>
        {/* Mini storage grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            width: `${cols * (cellSize + gap)}px`,
            gap: `${gap}px`,
          }}
        >
          {Array.from({ length: cols * rows }, (_, i) => {
            const inPage = i >= pageStart && i < pageEnd;
            return (
              <div
                key={i}
                style={{
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  borderRadius: "4px",
                  background: inPage ? "#2a7d6a" : "#e2ddd7",
                }}
              />
            );
          })}
        </div>
      </div>
    ),
    { ...size }
  );
}
