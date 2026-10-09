import { describe, expect, it } from "vitest";

import { getKnowledgeBundle } from "@/lib/ai/knowledge";

describe("MIP knowledge bundle", () => {
  it("loads reviewed MIP-3 facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-3.md -->");
    expect(bundle).toContain("# MIP-3: Linear Memory");
    expect(bundle).toContain("**Proposal status:** Final");
    expect(bundle).toContain("Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026");
    expect(bundle).toContain("memory_cost = memory_size_words // 2");
    expect(bundle).toContain("remaining_memory = 8 * 1024 * 1024 - j - k");
    expect(bundle).toContain("halts exceptionally, consuming all gas remaining in that call frame");
    expect(bundle).toContain("131,072 gas");
    expect(bundle).toContain("https://forum.monad.xyz/t/mip-3-linear-evm-memory-cost/362");
    expect(bundle).toContain("https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-3.md");
    expect(bundle).not.toContain("TODO(author): why the quadratic model");
  });

  it("loads reviewed MIP-4 facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-4.md -->");
    expect(bundle).toContain("# MIP-4: Reserve Balance Introspection");
    expect(bundle).toContain("**Proposal status:** Final");
    expect(bundle).toContain("Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026");
    expect(bundle).toContain("address `0x1001`");
    expect(bundle).toContain("invoked strictly via `CALL`");
    expect(bundle).toContain("STATICCALL, DELEGATECALL, or CALLCODE must revert");
    expect(bundle).toContain("0x3a61584e");
    expect(bundle).toContain("GAS_DIPPED_INTO_RESERVE");
    expect(bundle).toContain("method not supported");
    expect(bundle).toContain("input is invalid");
    expect(bundle).toContain("value is nonzero");
    expect(bundle).toContain("consumes all gas provided to the call frame");
    expect(bundle).toContain("https://forum.monad.xyz/t/mip-4-reserve-balance-introspection/363");
    expect(bundle).toContain("https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-4.md");
    expect(bundle).not.toContain("TODO(author): paste the spec text");
  });

  it("loads reviewed MIP-7 facts and excludes placeholders", async () => {
    const bundle = await getKnowledgeBundle();

    expect(bundle).toContain("<!-- file: mip-7.md -->");
    expect(bundle).toContain("# MIP-7: Extension Opcodes");
    expect(bundle).toContain("**Proposal status:** Draft");
    expect(bundle).toContain("**Network status:** No activation evidence in this bundle");
    expect(bundle).toContain("`EXTENSION` (`0xAE`)");
    expect(bundle).toContain("0xAE XX");
    expect(bundle).toContain("0x5B");
    expect(bundle).toContain("0x60`-`0x7F");
    expect(bundle).toContain("end of bytecode without a subsequent selector byte has no selector and causes an exceptional halt, consuming all remaining gas");
    expect(bundle).toContain("INVALID");
    expect(bundle).toContain("0xFE");
    expect(bundle).toContain("Restricted-range immediates");
    expect(bundle).toContain("PUSH-prefix immediates");
    expect(bundle).toContain("JUMPDEST");
    expect(bundle).toContain("https://forum.monad.xyz/t/mip-7-extension-opcodes/387");
    expect(bundle).toContain("https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-7.md");
    expect(bundle).not.toContain("TODO(author): paste the spec text");
  });

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
