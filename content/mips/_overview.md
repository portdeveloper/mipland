# Monad Improvement Proposals (MIPs)

MIPs are the formal mechanism for proposing changes to the Monad protocol. Each
MIP describes a self-contained change to the EVM execution layer, gas schedule,
storage model, or consensus interface, along with rationale, compatibility
notes, and a path to activation.

## Currently live on mipland.org

- **MIP-3 — Linear Memory.** Replaces the EVM's quadratic memory-expansion cost
  with a linear model, so large memory regions become predictable to price.
- **MIP-4 — Reserve Balance Introspection.** Lets the protocol detect reserve
  balance violations mid-execution rather than only at the end of a transaction.
- **MIP-7 — Extension Opcodes.** Reserves a namespace in the opcode space so
  new opcodes can be added safely without colliding with future EIPs.
- **MIP-8 — Page-ified Storage.** Aligns EVM storage layout with the underlying
  hardware page boundary, reducing I/O amplification on commits. Final and
  active on Monad mainnet since the MONAD_TEN upgrade on September 2, 2026.
- **MIP-12 — Decrease Block Time.** Final; its 400ms to 300ms target vote pace
  activated on Monad mainnet at round 89,758,000 (July 23, 2026). Per-block
  transaction, gas, and byte limits fell 25%; the block reward fell from 25 to
  18 MON (28%). At the nominal cadence, capacity limits per second stay the
  same while rewards change from 62.5 to 60 MON per second. Target cadence does
  not guarantee observed latency or finality; see `mip-12.md` for dated sources.

> TODO(author): paste the canonical one-paragraph summary for each MIP here.
> Anything below this line in this file is treated as authoritative context by
> the chat widget — keep it accurate and short.
