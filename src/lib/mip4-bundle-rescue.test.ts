import { describe, expect, it } from "vitest";

import {
  FIRST_ATTEMPT_FINAL_STEP,
  RETRY_FINAL_STEP,
  baselineStatus,
  mip4Status,
  retryStatus,
} from "./mip4-bundle-rescue";

describe("MIP-4 Bundle Rescue state", () => {
  it("lets every baseline sub-call appear successful before the final check", () => {
    expect(baselineStatus(3, 4)).toBe("success");
    expect(baselineStatus(4, 4)).toBe("executing");
    expect(baselineStatus(5, 4)).toBe("pending");
  });

  it("rolls the entire baseline bundle back at transaction completion", () => {
    for (const operationId of [1, 2, 3, 4, 5]) {
      expect(baselineStatus(operationId, FIRST_ATTEMPT_FINAL_STEP)).toBe(
        "reverted",
      );
    }
  });

  it("attributes the first true MIP-4 probe to operation three", () => {
    expect(mip4Status(2, 4)).toBe("success");
    expect(mip4Status(3, 4)).toBe("flagged");
    expect(mip4Status(4, 4)).toBe("skipped");
    expect(mip4Status(5, 4)).toBe("skipped");
  });

  it("omits operation three and includes the four good operations on retry", () => {
    expect(retryStatus(3, RETRY_FINAL_STEP)).toBe("omitted");

    for (const operationId of [1, 2, 4, 5]) {
      expect(retryStatus(operationId, RETRY_FINAL_STEP)).toBe("included");
    }
  });
});
