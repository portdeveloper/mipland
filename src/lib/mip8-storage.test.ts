import { describe, expect, it } from "vitest";
import {
  classifyStorageAccesses,
  storagePageKey,
} from "./mip8-storage";

describe("MIP-8 storage page identity", () => {
  it("groups adjacent slots in the same account", () => {
    expect(storagePageKey("Pair", 6)).toBe(storagePageKey("Pair", 12));
  });

  it("keeps the same page index cold across different accounts", () => {
    expect(storagePageKey("Token 0", 7823)).not.toBe(
      storagePageKey("Token 1", 7823),
    );
  });

  it("charges repeated slot accesses at the warm base cost", () => {
    const accesses = classifyStorageAccesses([
      { account: "Token", slot: 12 },
      { account: "Token", slot: 12 },
    ]);

    expect(accesses).toMatchObject([
      { coldPreMip8: true, coldMip8: true, preMip8Gas: 8_100, mip8Gas: 8_100 },
      { coldPreMip8: false, coldMip8: false, preMip8Gas: 100, mip8Gas: 100 },
    ]);
  });

  it("warms a page after its first access while preserving legacy slot costs", () => {
    const accesses = classifyStorageAccesses([
      { account: "Token", slot: 0 },
      { account: "Token", slot: 127 },
      { account: "Token", slot: 128 },
      { account: "Other token", slot: 0 },
    ]);

    expect(
      accesses.map(({ preMip8Gas, mip8Gas }) => [preMip8Gas, mip8Gas]),
    ).toEqual([
      [8_100, 8_100],
      [8_100, 100],
      [8_100, 8_100],
      [8_100, 8_100],
    ]);
  });
});
