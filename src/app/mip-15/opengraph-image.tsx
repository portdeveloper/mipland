import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-15: Glamsterdam EIP Activation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
            marginBottom: "16px",
          }}
        >
          MIP-15
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 300,
            color: "#1a1714",
            letterSpacing: "-1px",
            marginBottom: "40px",
          }}
        >
          Glamsterdam EIP Activation
        </div>

        {/* 6 adopted / 12 left out */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "32px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "120px",
              fontWeight: 300,
              color: "#c4653a",
            }}
          >
            12
          </span>
          <span style={{ fontSize: "64px", color: "#9b9084" }}>/</span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "150px",
              fontWeight: 700,
              color: "#2a7d6a",
            }}
          >
            6
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: "22px",
            color: "#6b6259",
          }}
        >
          left out / adopted · in review
        </div>
      </div>
    ),
    { ...size }
  );
}
