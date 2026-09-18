import { describe, expect, it } from "vitest";
import { classifyMip8Schedule, makeProbeBatch, parseProbeBatch } from "./mip8-watch";

const MAINNET_CHAIN_ID = 143;

/** A complete, in-order batch reply for the mainnet probe. */
const validBatch = () => [
  { jsonrpc: "2.0", id: 1, result: "0x33cdac5" },
  { jsonrpc: "2.0", id: 2, result: "0x228a" },
  { jsonrpc: "2.0", id: 3, result: "0xfd4a" },
  { jsonrpc: "2.0", id: 4, result: "0x8f" },
];

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

describe("makeProbeBatch", () => {
  it("asks the endpoint for its own chain ID", () => {
    expect(makeProbeBatch()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 4, method: "eth_chainId" }),
      ])
    );
  });
});

describe("parseProbeBatch", () => {
  it("matches out-of-order JSON-RPC responses by ID", () => {
    expect(
      parseProbeBatch(
        [
          { jsonrpc: "2.0", id: 4, result: "0x8f" },
          { jsonrpc: "2.0", id: 3, result: "0xfd4a" },
          { jsonrpc: "2.0", id: 1, result: "0x33cdac5" },
          { jsonrpc: "2.0", id: 2, result: "0x228a" },
        ],
        MAINNET_CHAIN_ID
      )
    ).toEqual({
      blockNumber: 54_319_813,
      contiguousGas: 8_842,
      scatteredGas: 64_842,
      status: "active",
    });
  });

  it("accepts measurements when the chain ID matches", () => {
    expect(parseProbeBatch(validBatch(), MAINNET_CHAIN_ID).status).toBe("active");
  });

  // The bug this guards: a testnet URL pointing at a mainnet endpoint published mainnet
  // measurements under the testnet label, because the configured chain ID was copied into the
  // result and never checked against the endpoint that produced it.
  it("rejects measurements from the wrong chain", () => {
    expect(() => parseProbeBatch(validBatch(), 10_143)).toThrow(
      "RPC reports chain ID 143 but 10143 was expected"
    );
  });

  it("rejects a batch with no chain ID in it", () => {
    const withoutChainId = validBatch().filter((entry) => entry.id !== 4);
    expect(() => parseProbeBatch(withoutChainId, MAINNET_CHAIN_ID)).toThrow(
      "RPC failed to return chain ID"
    );
  });

  it("rejects a chain ID the RPC reports as an error", () => {
    const erroring = validBatch().map((entry) =>
      entry.id === 4
        ? { jsonrpc: "2.0", id: 4, error: { code: -32_601, message: "not supported" } }
        : entry
    );
    expect(() => parseProbeBatch(erroring, MAINNET_CHAIN_ID)).toThrow(
      "RPC failed to return chain ID"
    );
  });

  it("rejects a malformed chain ID", () => {
    const malformed = validBatch().map((entry) =>
      entry.id === 4 ? { jsonrpc: "2.0", id: 4, result: "mainnet" } : entry
    );
    expect(() => parseProbeBatch(malformed, MAINNET_CHAIN_ID)).toThrow(
      "Invalid chain ID returned by RPC"
    );
  });

  it("checks the chain before reading the measurements", () => {
    // Gas results are absent as well as the chain being wrong. The chain ID has to be the
    // complaint, otherwise a mismatched endpoint would be reported as a probe failure and the
    // real cause would stay hidden.
    expect(() =>
      parseProbeBatch(
        [{ jsonrpc: "2.0", id: 4, result: "0x8f" }],
        10_143
      )
    ).toThrow("RPC reports chain ID 143 but 10143 was expected");
  });

  it("rejects incomplete responses", () => {
    expect(() =>
      parseProbeBatch([{ id: 4, result: "0x8f" }, { id: 1, result: "0x1" }], MAINNET_CHAIN_ID)
    ).toThrow("RPC failed to return contiguous probe");
  });
});
