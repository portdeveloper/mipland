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
  hardware page boundary, reducing I/O amplification on commits.

> TODO(author): paste the canonical one-paragraph summary for each MIP here.
> Anything below this line in this file is treated as authoritative context by
> the chat widget — keep it accurate and short.
