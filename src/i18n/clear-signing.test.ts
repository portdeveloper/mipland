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

describe("Clear Signing translations", () => {
  it("keeps English and Chinese translation keys in sync", () => {
    expect(leafPaths(zh.clearSigning)).toEqual(leafPaths(en.clearSigning));
  });

  it("localizes the navigation label", () => {
    expect(zh.nav.clearSigning).toBe("清晰签名");
    expect(en.nav.clearSigning).toBe("Clear Signing");
  });
});
