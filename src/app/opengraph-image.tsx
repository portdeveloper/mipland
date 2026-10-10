import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP Land: Interactive Monad Improvement Proposals";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Deterministic storage grid pattern (10 rows x 10 cols)
// 0=empty  1=warm(orange)  2=cool(teal)  3=transitional(gray)
const GRID = [
  [0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 3, 3, 3, 3, 0, 0, 0],
  [0, 0, 0, 0, 3, 3, 3, 3, 0, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 0],
  [0, 0, 0, 0, 2, 2, 2, 2, 2, 0],
  [0, 0, 0, 0, 0, 2, 2, 2, 2, 2],
  [0, 0, 0, 0, 0, 0, 2, 2, 2, 2],
];

const CELL_BG: Record<number, string> = {
  0: "#e5e0d8",
  1: "#c4653a",
  2: "#2a7d6a",
  3: "#a89e94",
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8f6f3",
          width: "100%",
          height: "100%",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Left: brand + copy */}
        <div
          style={{
            width: "560px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 52px 64px 68px",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: "84px",
              fontWeight: 800,
              color: "#1a1714",
              letterSpacing: "-4px",
              lineHeight: "0.92",
              marginBottom: "28px",
            }}
          >
            MIP Land
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "#6b6259",
              lineHeight: "1.6",
              marginBottom: "48px",
            }}
          >
            Interactive explainers for Monad Improvement Proposals. Change the
            inputs and watch the protocol respond.
          </div>

          {/* URL */}
          <div
            style={{
              marginTop: "44px",
              fontSize: "15px",
              color: "#b0a898",
              letterSpacing: "0.3px",
            }}
          >
            mipland.com
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: "1px",
            background: "#ddd8d0",
            margin: "56px 0",
          }}
        />

        {/* Right: storage grid visualization */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0ece5",
            gap: "0px",
          }}
        >
          {/* Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {GRID.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: "5px" }}>
                {row.map((cell, j) => (
                  <div
                    key={j}
                    style={{
                      width: "48px",
                      height: "48px",
                      background: CELL_BG[cell],
                      borderRadius: "8px",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
