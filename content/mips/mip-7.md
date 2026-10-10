# MIP-7: Extension Opcodes

**Proposal status:** Review

**Network status:** No activation evidence in this bundle. The official release notes record no MIP-7 activation on any network.

**Verified:** October 10, 2026, against the [canonical MIP-7 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases).

**Summary:** Reserves a namespace in the opcode space so new opcodes can be
added safely without colliding with future EIPs.

## Motivation

> TODO(author).

## Specification

> TODO(author): paste the rest of the spec text.

- `0xAE` (`EXTENSION`) must be followed by a 1-byte extension selector.
- A selector of `0x5B` (`JUMPDEST`) or `0x60`-`0x7F` (`PUSH1`-`PUSH32`) causes
  an exceptional halt that consumes all remaining gas.
- A `0xAE` byte at the very end of the code has no selector. It also causes an
  exceptional halt that consumes all remaining gas. This rule was added on
  October 1, 2026.

## Backwards compatibility

> TODO(author).

## Sources

- [Canonical MIP-7 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-7.md): proposal status (Review since October 5, 2026) and encoding rules.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases): no MIP-7 activation listed as of the verification date.

## Discussion link

https://mipland.org/mip-7
