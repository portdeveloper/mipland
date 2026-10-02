import { describe, expect, it } from "vitest";
import en from "./en";
import zh from "./zh";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];

  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("MIP-8 translations", () => {
  it("keeps English and Chinese translation keys in sync", () => {
    expect(leafPaths(zh.mip8)).toEqual(leafPaths(en.mip8));
  });

  it("has copy for every network and status the watcher can report", () => {
    for (const dict of [en, zh]) {
      expect(Object.keys(dict.mip8.watch.networks)).toEqual(["mainnet", "testnet"]);
      expect(Object.keys(dict.mip8.watch.status)).toEqual([
        "active",
        "inactive",
        "unknown",
        "unavailable",
      ]);
    }
  });
});
