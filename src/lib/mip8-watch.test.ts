import { describe, expect, it } from "vitest";
import { classifyMip8Schedule, parseProbeBatch } from "./mip8-watch";

describe("classifyMip8Schedule", () => {
  it("detects the page-warming schedule", () => {
    expect(classifyMip8Schedule(8_842, 64_842)).toBe("active");
  });

  it("detects the per-slot cold schedule", () => {
    expect(classifyMip8Schedule(64_842, 64_842)).toBe("inactive");
  });

  it("does not overstate an unrecognized schedule", () => {
    expect(classifyMip8Schedule(20_000, 64_842)).toBe("unknown");
  });
});

describe("parseProbeBatch", () => {
  it("matches out-of-order JSON-RPC responses by ID", () => {
    expect(
      parseProbeBatch([
        { jsonrpc: "2.0", id: 3, result: "0xfd4a" },
        { jsonrpc: "2.0", id: 1, result: "0x33cdac5" },
        { jsonrpc: "2.0", id: 2, result: "0x228a" },
      ])
    ).toEqual({
      blockNumber: 54_319_813,
      contiguousGas: 8_842,
      scatteredGas: 64_842,
      status: "active",
    });
  });

  it("rejects incomplete responses", () => {
    expect(() => parseProbeBatch([{ id: 1, result: "0x1" }])).toThrow(
      "RPC failed to return contiguous probe"
    );
  });
});
