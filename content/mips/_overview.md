# Monad Improvement Proposals (MIPs)

MIPs are the formal mechanism for proposing changes to the Monad protocol. Each
MIP describes a self-contained change to the EVM execution layer, gas schedule,
storage model, or consensus interface, along with rationale, compatibility
notes, and a path to activation.

## Currently live on mipland.org

- **MIP-3 — Linear Memory.** Final; linear memory expansion cost model with an
  8 MB call-frame memory limit, activated on Monad mainnet with the MONAD_NINE
  upgrade on March 19, 2026. Exceeding remaining memory halts exceptionally,
  consuming all gas in the call frame.
- **MIP-4 — Reserve Balance Introspection.** Final; introspection precompile at
  address `0x1001` (`dippedIntoReserve`) that detects reserve balance
  violations mid-execution. CALL-only, 100 gas, with strict calldata ordering
  and all-gas-consuming reverts; activated on Monad mainnet with the MONAD_NINE
  upgrade on March 19, 2026.
- **MIP-7 — Extension Opcodes.** Draft; reserves opcode `EXTENSION` (`0xAE`)
  for two-byte opcode expansion (`0xAE XX`) while preserving `JUMPDEST`
  analysis. Restricts selectors (no `0x5B` or `0x60`-`0x7F`) and trailing
  `EXTENSION` bytes; activation is unverified.
- **MIP-8 — Page-ified Storage.** Aligns EVM storage layout with the underlying
  hardware page boundary, reducing I/O amplification on commits. Final and
  active on Monad mainnet since the MONAD_TEN upgrade on September 2, 2026.
- **MIP-12 — Decrease Block Time.** Final; its 400ms to 300ms target vote pace
  activated on Monad mainnet at round 89,758,000 (July 23, 2026). Per-block
  transaction, gas, and byte limits fell 25%; the block reward fell from 25 to
  18 MON (28%). At the nominal cadence, capacity limits per second stay the
  same while rewards change from 62.5 to 60 MON per second. Target cadence does
  not guarantee observed latency or finality; see `mip-12.md` for dated sources.
