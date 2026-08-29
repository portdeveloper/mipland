import { afterEach, describe, expect, it } from "vitest";

import {
  getSiloRailClient,
  resetSiloRailClientForTests,
  SiloRailConfigError,
  silorailErrorResponse,
} from "./silorail";

describe("SiloRail chat config", () => {
  const originalVercel = process.env.VERCEL;
  const originalWalletKey = process.env.SILORAIL_WALLET_KEY;

  afterEach(() => {
    resetSiloRailClientForTests();
    restoreEnv("VERCEL", originalVercel);
    restoreEnv("SILORAIL_WALLET_KEY", originalWalletKey);
  });

  it("requires an explicit wallet key on Vercel", () => {
    process.env.VERCEL = "1";
    delete process.env.SILORAIL_WALLET_KEY;

    expect(() => getSiloRailClient()).toThrow(SiloRailConfigError);
  });

  it("returns an actionable setup error instead of leaking key-file paths", async () => {
    const response = silorailErrorResponse(
      new SiloRailConfigError("SILORAIL_WALLET_KEY is required."),
    );

    await expect(response.json()).resolves.toEqual({
      error:
        "The MIP Assistant is missing its SiloRail wallet configuration. " +
        "Set SILORAIL_WALLET_KEY for this deployment.",
    });
    expect(response.status).toBe(503);
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
