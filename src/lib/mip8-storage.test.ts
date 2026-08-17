import { describe, expect, it } from "vitest";
import { storagePageKey } from "./mip8-storage";

describe("MIP-8 storage page identity", () => {
  it("groups adjacent slots in the same account", () => {
    expect(storagePageKey("Pair", 6)).toBe(storagePageKey("Pair", 12));
  });

  it("keeps the same page index cold across different accounts", () => {
    expect(storagePageKey("Token 0", 7823)).not.toBe(
      storagePageKey("Token 1", 7823),
    );
  });
});
