import { describe, expect, it } from "vitest";
import en from "./en";
import zh from "./zh";

describe("MIP-12 localized status", () => {
  it("states Final status and mainnet activation in English and Chinese", () => {
    expect(en.home.mip12.description).toContain("Final");
    expect(en.mip12.hero.desc).toContain("round 89,758,000");
    expect(en.mip12.why.chartNote).toContain("limits fall 25%");
    expect(en.footer.mip12Note).toContain("activated on Monad mainnet");
    expect(en.footer.mip12Note).toContain("October 4, 2026");
    expect(en.footer.mip12ActivationSource).toContain("activation evidence");

    expect(zh.home.mip12.description).toContain("已定稿");
    expect(zh.mip12.hero.desc).toContain("89,758,000");
    expect(zh.mip12.why.chartNote).toContain("上限降低 25%");
    expect(zh.footer.mip12Note).toContain("主网");
    expect(zh.footer.mip12Note).toContain("2026 年 10 月 4 日");
    expect(zh.footer.mip12ActivationSource).toContain("官方激活证据");
  });

  it("removes the stale draft and not-live claims", () => {
    const copy = [
      en.home.mip12.description,
      en.mip12.hero.desc,
      en.footer.mip12Note,
      zh.home.mip12.description,
      zh.mip12.hero.desc,
      zh.footer.mip12Note,
    ].join(" ");

    expect(copy).not.toMatch(/draft|not live on mainnet|草案|未在主网上线/i);
  });
});
