import { describe, expect, it } from "vitest";

import { getKnowledgeBundle } from "@/lib/ai/knowledge";

describe("MIP-12 knowledge bundle", () => {
  it("loads current MIP-12 status and sourced activation facts", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: _overview.md -->");
    expect(bundle).toContain("<!-- file: mip-12.md -->");
    expect(bundle).toContain("**Proposal status:** Final");
    expect(bundle).toContain("mainnet at round 89,758,000");
    expect(bundle).toContain("5,000 | 3,750");
    expect(bundle).toContain("200,000,000 | 150,000,000");
    expect(bundle).toContain("2,000,000 bytes | 1,500,000 bytes");
    expect(bundle).toContain("25 MON | 18 MON | 28% lower");
    expect(bundle).toContain("62.5 to 60 MON per second");
    expect(bundle).toContain("does not guarantee a particular observed block latency or time to finality");
    expect(bundle).toContain("Verified:** October 4, 2026");
    expect(bundle).not.toContain("Draft (not live on mainnet)");
    expect(bundle).not.toContain("A draft consensus-layer change, not yet live on mainnet");
  });
});

describe("MIP-15 knowledge bundle", () => {
  it("includes MIP-15 with its Review status and no activation claim", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-15.md -->");
    expect(bundle).toContain("# MIP-15: Glamsterdam EIP Activation");
    expect(bundle).toContain("MIP-15: Glamsterdam EIP Activation.** In Review");
    expect(bundle).toContain("40 gas per byte instead of Ethereum's 64");
  });
});
