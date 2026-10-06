# MIP-7: Extension Opcodes

**Proposal status:** Draft

**Network status:** No activation evidence in this bundle. The official release notes record no MIP-7 activation on any network.

**Verified:** October 4, 2026, against the [canonical MIP-7 specification](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-7.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases).

## Summary

MIP-7 reserves the `EXTENSION` (`0xAE`) opcode to provide a collision-resistant namespace for Monad VM opcode-level features, aligning with Ethereum L1's EIP-8163 reservation and preserving standard EVM jump destination analysis.

## Motivation

Standard EVM bytecode execution on Monad is fully compatible with Ethereum. As Monad introduces execution-layer innovations that warrant new instructions, assigning them directly to unallocated 1-byte opcode spaces risks colliding with future Ethereum hard forks. EIP-8163 explicitly reserves `0xAE` on Ethereum L1 so that non-L1 chains can experiment with opcode extensions safely. MIP-7 adopts this standard to provide an expandable two-byte opcode scheme while protecting cross-chain tooling and bytecode analysis.

## Specification

### Extended opcode encoding

The `EXTENSION` opcode (`0xAE`) is immediately followed by a 1-byte extension selector, forming a two-byte sequence `0xAE XX`.

### Selector restrictions

To preserve `JUMPDEST` analysis and prevent ambiguity:
- The extension selector `XX` must not be `0x5B` (`JUMPDEST`).
- The extension selector `XX` must not fall in the range `0x60`-`0x7F` (`PUSH1`-`PUSH32`).
- An extension selector in this excluded range causes an exceptional halt that consumes all remaining gas.
- An `EXTENSION` byte (`0xAE`) located at the end of bytecode without a subsequent selector byte has no selector and causes an exceptional halt, consuming all remaining gas.

### Undefined selector behavior

Until a subsequent MIP formally assigns semantics to a specific selector, executing any extended opcode must behave identically to executing `INVALID` (`0xFE`): it halts execution, consumes all gas, and reverts state.

### Immediate argument encoding styles

When future extension opcodes require immediate argument operands, proposals must adopt one of two canonical encoding schemes:

1. **Restricted-range immediates**:
   `0xAE XX a1 a2 ...`
   Argument bytes directly follow the extended opcode. Each argument byte must not be `0x5B` or in the range `0x60`-`0x7F`. The argument count is fixed per selector.
2. **PUSH-prefix immediates**:
   `0xAE XX PUSHx b1 b2 ... bn`
   A standard `PUSHx` byte (`0x60`-`0x7F`) frames the immediate payload. The `PUSHx` opcode defines the argument length ($n = \text{opcode} - 0x5F$) and allows any byte value in the full range `0x00`-`0xFF`.

In either scheme, an extended opcode followed by malformed or incorrectly encoded argument bytes must behave as `INVALID` (`0xFE`).

## Backwards compatibility

The byte `0xAE` is unassigned and invalid on legacy Ethereum and Monad. Because extension selectors exclude `0x5B` and `PUSH` opcodes, `JUMPDEST` analysis remains unaffected: an `0xAE` followed by `0x5B` on either chain still treats `0x5B` as a valid jump destination.

## Sources

- [Canonical MIP-7 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-7.md): proposal status (Draft), `EXTENSION` opcode (`0xAE`) encoding, selector exclusion rules, and argument encoding styles.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases): no MIP-7 activation recorded as of the verification date.
- [EIP-8163: Reserve EXTENSION (0xAE) Opcode](https://eips.ethereum.org/EIPS/eip-8163): canonical reservation on Ethereum L1.

## Discussion link

https://forum.monad.xyz/t/mip-7-extension-opcodes/387
