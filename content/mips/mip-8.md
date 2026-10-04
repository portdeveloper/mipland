# MIP-8: Page-ified Storage

**Proposal status:** Final

**Network status:** Activated with the MONAD_TEN upgrade on Monad mainnet on September 2, 2026, 14:30 UTC, and on testnet on August 12, 2026, 14:30 UTC.

**Verified:** October 4, 2026, against the [canonical MIP-8 specification](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-8.md) and the [official v0.16.1 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-16-1).

**Summary:** Groups 128 consecutive EVM storage slots into 4 KB pages, making
the page the unit of storage commitment, I/O, and cold-access accounting.

## Motivation

The legacy storage trie hashes individual 32-byte slot keys even though database
hardware reads 4 KB pages. That destroys locality: related slots can require
independent disk reads and independent cold-access charges. MIP-8 aligns the
state model and gas schedule with the hardware page that nodes actually load.

## Specification

- A page contains 128 consecutive 32-byte slots.
- `page_index(slot) = slot >> 7` and `offset(slot) = slot & 0x7f`.
- The first `SLOAD` from a page costs 8,100 gas: 8,000 gas to load the page plus
  a 100-gas base charge. Later reads from that page cost 100 gas.
- `SSTORE` charges page-level read and write I/O plus per-slot state-growth
  costs. The final constants are 2,800 gas for the first changing write to a
  page and 17,000 gas whenever a page's current state growth during the
  transaction exceeds that page's previous high-water mark. Capacity freed
  earlier in the same page can be reused without another growth charge.
- Each page is sealed by an induced BLAKE3-based subtree over occupied slot
  pairs and committed as a leaf in the storage Merkle Patricia Trie.

## Backwards compatibility

`SLOAD` and `SSTORE` keep their existing opcode semantics, and existing storage
layouts remain valid. Gas costs can change for contracts that access several
slots in the same page, so software must not hardcode legacy per-slot costs.

## Sources

- [Canonical MIP-8 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-8.md): proposal status.
- [Monad v0.16.1 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-16-1): MONAD_TEN activates MIP-8 on mainnet at timestamp 1788359400.
- [Monad v0.16.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-16-0): MONAD_TEN activates MIP-8 on testnet at timestamp 1786545000.

## Discussion link

https://mipland.org/mip-8
