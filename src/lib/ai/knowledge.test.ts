import { describe, expect, it } from "vitest";

import { getKnowledgeBundle } from "@/lib/ai/knowledge";

describe("MIP-3 knowledge bundle", () => {
  it("loads reviewed facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-3.md -->");
    expect(bundle).toContain("# MIP-3: Linear Memory");
    expect(bundle).toContain("**Proposal status:** Final");
    expect(bundle).toContain(
      "Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026",
    );
    expect(bundle).toContain("memory_cost = memory_size_words // 2");
    expect(bundle).toContain("8 * 1024 * 1024 - j - k");
    expect(bundle).toContain("8 MB per transaction, shared across call frames");
    expect(bundle.replace(/\s+/g, " ")).toContain(
      "halts exceptionally and consumes all gas left in that call frame",
    );
    expect(bundle).toContain(
      "https://forum.monad.xyz/t/mip-3-linear-evm-memory-cost/362",
    );
    expect(bundle).toContain(
      "https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-3.md",
    );
    expect(bundle).not.toContain("TODO(author)");
  });
});

describe("MIP-4 knowledge bundle", () => {
  it("loads reviewed facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-4.md -->");
    expect(bundle).toContain("# MIP-4: Reserve Balance Introspection");
    expect(bundle).toContain("**Proposal status:** Final");
    expect(bundle).toContain(
      "Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026",
    );
    expect(bundle).toContain("`0x1001`");
    expect(bundle).toContain("It must be called with `CALL`");
    expect(bundle).toContain("STATICCALL");
    expect(bundle).toContain("DELEGATECALL");
    expect(bundle).toContain("CALLCODE");
    expect(bundle).toContain("0x3a61584e");
    expect(bundle).toContain("100 gas, the same as one `TLOAD`");
    expect(bundle).toContain("method not supported");
    expect(bundle).toContain("input is invalid");
    expect(bundle).toContain("value is nonzero");
    expect(bundle).toContain(
      "Every revert consumes all gas given to the call frame",
    );
    expect(bundle).toContain(
      "https://forum.monad.xyz/t/mip-4-reserve-balance-introspection/363",
    );
    expect(bundle).toContain(
      "https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-4.md",
    );
    expect(bundle).not.toContain("TODO(author)");
  });
});

describe("MIP-7 knowledge bundle", () => {
  it("loads reviewed facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-7.md -->");
    expect(bundle).toContain("# MIP-7: Extension Opcodes");
    expect(bundle).toContain("**Proposal status:** Review");
    expect(bundle).toContain(
      "**Network status:** No activation evidence in this bundle",
    );
    expect(bundle).toContain("`EXTENSION` (`0xAE`)");
    expect(bundle).toContain("0xAE XX");
    expect(bundle).toContain("0x5B");
    expect(bundle).toContain("0x60`-`0x7F");
    expect(bundle).toContain("at the very end of the code has no selector");
    expect(bundle).toContain("INVALID");
    expect(bundle).toContain("0xFE");
    expect(bundle).toContain("Restricted-range immediates");
    expect(bundle).toContain("PUSH-prefix immediates");
    expect(bundle).toContain("JUMPDEST");
    expect(bundle).toContain(
      "https://forum.monad.xyz/t/mip-7-extension-opcodes/387",
    );
    expect(bundle).toContain(
      "https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md",
    );
    expect(bundle).not.toContain("TODO(author)");
  });
});

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

describe("MIP-18 knowledge bundle", () => {
  it("includes MIP-18 with its Review status and no activation claim", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-18.md -->");
    expect(bundle).toContain("# MIP-18: Call Stack Introspection Opcodes");
    expect(bundle).toContain("MIP-18: Call Stack Introspection Opcodes.** In Review");
    expect(bundle).toContain("`CALLERN(CALLSTACKDEPTH)` equals `ORIGIN`");
  });
});

describe("MIP-11 knowledge bundle", () => {
  it("includes MIP-11 with its Draft status and the open minimum-amount question", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-11.md -->");
    expect(bundle).toContain("# MIP-11: Automatic Priority Fee Distribution");
    expect(bundle).toContain("MIP-11: Automatic Priority Fee Distribution.** Draft");
    expect(bundle).toContain("The spec does not say which one applies");
  });
});

describe("MIP-10 knowledge bundle", () => {
  it("includes MIP-10 with its Draft status and stage-3 rollout", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-10.md -->");
    expect(bundle).toContain("# MIP-10: Deterministic RaptorCast");
    expect(bundle).toContain("MIP-10: Deterministic RaptorCast.** Draft, rolling out");
    expect(bundle).toContain("Accept both, publish v1. Shipped in v0.16.2");
  });
});

describe("MIP-16 knowledge bundle", () => {
  it("includes MIP-16 with its Draft status and no client release", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-16.md -->");
    expect(bundle).toContain("# MIP-16: JSON-RPC Query Methods");
    expect(bundle).toContain("MIP-16: JSON-RPC Query Methods.** Draft, not served");
    expect(bundle).toContain("Not served by any Monad client release");
  });
});
