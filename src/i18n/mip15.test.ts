import { describe, expect, it } from "vitest";
import en from "./en";
import { surcharge } from "@/components/mip15/AccessListCostSection";

describe("MIP-15 copy", () => {
  it("states Review status and no activation", () => {
    expect(en.home.mip15.subtitle).toContain("not active on any network");
    expect(en.mip15.hero.desc).toContain("in Review");
    expect(en.footer.mip15Note).toContain("October 10, 2026");
  });

  it("uses Monad's 40 gas per byte EIP-7981 rate", () => {
    expect(surcharge(1, 0, 40)).toBe(800);
    expect(surcharge(0, 1, 40)).toBe(1280);
    expect(surcharge(1, 0, 64)).toBe(1280);
    expect(surcharge(0, 1, 64)).toBe(2048);
    expect(en.mip15.adopted.e7981Monad).toContain("800 gas per address and 1,280 per storage key");
  });
});
