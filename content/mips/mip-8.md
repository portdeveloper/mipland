# MIP-8: Page-ified Storage

**Status:** Final; active on Monad mainnet since September 2, 2026 at 14:30 UTC
as part of the MONAD_TEN network upgrade.
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
  costs. The final constants are 2,800 gas for the first page write and 17,000
  gas for each net-new occupied slot.
- Each page is sealed by an induced BLAKE3-based subtree over occupied slot
  pairs and committed as a leaf in the storage Merkle Patricia Trie.

## Backwards compatibility

`SLOAD` and `SSTORE` keep their existing opcode semantics, and existing storage
layouts remain valid. Gas costs can change for contracts that access several
slots in the same page, so software must not hardcode legacy per-slot costs.

## Activation

- Monad testnet: August 12, 2026 at 14:30 UTC
- Monad mainnet: September 2, 2026 at 14:30 UTC

## Canonical specification

https://github.com/monad-crypto/MIPs/blob/main/MIPs/MIP-8.md

## Discussion link

https://mipland.org/mip-8
