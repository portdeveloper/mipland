import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MIP-7: Extension Opcodes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A simplified opcode grid for the OG image
// 16 columns × 8 rows = 128 cells (upper half of opcode space)
const COLS = 16;
const ROWS = 8;
const TOTAL = COLS * ROWS;

// Mark defined opcodes in the first 128 (0x00–0x7F)
const DEFINED_LO = new Set([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
  0x20,
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f,
  0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
  0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e,
  0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f,
  0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f,
]);

export default function Image() {
  const cellSize = 18;
  const gap = 3;

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
          MIP-7
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 300,
            color: "#1a1714",
            letterSpacing: "-1px",
            marginBottom: "12px",
          }}
        >
          Extension Opcodes
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 300,
            color: "#6b6259",
            marginBottom: "40px",
          }}
        >
          One reserved slot. ~220 possible functions.
        </div>

        {/* Opcode grid (16×8, showing 0x00–0x7F) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
          }}
        >
          {Array.from({ length: ROWS }, (_, row) => (
            <div
              key={row}
              style={{ display: "flex", flexDirection: "row", gap: `${gap}px` }}
            >
              {Array.from({ length: COLS }, (_, col) => {
                const byte = row * COLS + col;
                const isDefined = DEFINED_LO.has(byte);
                const isExtension = byte === 0xae - TOTAL; // won't match in lo half

                return (
                  <div
                    key={col}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: isExtension
                        ? "#2a7d6a"
                        : isDefined
                        ? "#9b9084"
                        : "#e2ddd7",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Second grid row (0x80–0xFF) showing 0xAE highlighted */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${gap}px`,
            marginTop: `${gap}px`,
          }}
        >
          {Array.from({ length: ROWS }, (_, row) => (
            <div
              key={row}
              style={{ display: "flex", flexDirection: "row", gap: `${gap}px` }}
            >
              {Array.from({ length: COLS }, (_, col) => {
                const byte = TOTAL + row * COLS + col;
                const isExtension = byte === 0xae;
                const defined = new Set([
                  0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
                  0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,
                  0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
                  0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
                  0xa0, 0xa1, 0xa2, 0xa3, 0xa4,
                  0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xfa, 0xfd, 0xfe, 0xff,
                ]);
                const isDefined = defined.has(byte);

                return (
                  <div
                    key={col}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderRadius: 3,
                      backgroundColor: isExtension
                        ? "#2a7d6a"
                        : isDefined
                        ? "#9b9084"
                        : "#e2ddd7",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginTop: "24px",
            fontFamily: "monospace",
            fontSize: "13px",
            color: "#9b9084",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: "#9b9084",
              }}
            />
            149 defined
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: "#e2ddd7",
              }}
            />
            106 free
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: "#2a7d6a",
              }}
            />
            1 reserved for Monad
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
