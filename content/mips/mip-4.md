# MIP-4: Reserve Balance Introspection

**Proposal status:** Final

**Network status:** Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026, 14:30 UTC, and on testnet on March 10, 2026, 14:30 UTC.

**Verified:** October 4, 2026, against the [canonical MIP-4 specification](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-4.md) and the [official v0.13.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine).

## Summary

MIP-4 introduces a dedicated introspection precompile at address `0x1001` that allows contracts to query whether the execution state has dipped into reserve balances during a transaction, enabling mid-execution detection and recovery before transaction completion.

## Motivation

Monad's reserve balance mechanism protects against insolvency under pipelined execution by reverting transactions that leave any touched account below its reserve balance threshold at execution end. Without runtime introspection, contracts cannot observe whether an intermediate operation created a reserve violation. The precompile allows contracts (such as bundler entrypoints, multicall routers, or liquidity vaults) to query violation state mid-execution, restoring balances or taking alternative paths rather than suffering unavoidable post-execution reverts.

## Specification

### Precompile address and interface

The precompile is deployed at address `0x1001` and implements the following Solidity interface:

```solidity
interface IReserveBalance {
    function dippedIntoReserve() external returns (bool);
}
```

- `SELECTOR_DIPPED_INTO_RESERVE`: `0x3a61584e` (the 4-byte selector for `dippedIntoReserve()`).
- `GAS_DIPPED_INTO_RESERVE`: `100` gas (priced identically to a `tload` transient storage read).

### CALL-only invocation semantics

The precompile must be invoked strictly via `CALL`:
- STATICCALL, DELEGATECALL, or CALLCODE must revert.
- Invocations via EIP-7702 delegations targeting the precompile address must revert.
- The interface method is intentionally not declared `view` so that standard Solidity compilers emit `CALL` instead of `STATICCALL`.

### Calldata validation and failure ordering

Calldata must consist of exactly the 4-byte selector `0x3a61584e`. The method is non-payable.

If any failure condition is encountered, the precompile reverts and consumes all gas provided to the call frame (matching canonical Ethereum precompile behavior, rather than Solidity functions which refund unspent gas).

When multiple revert conditions are present, error messages are evaluated in the following strict order:

1. Invocation opcode is not `CALL`
2. `gas < GAS_DIPPED_INTO_RESERVE` (less than 100 gas provided)
3. `len(calldata) < 4` (reverts with `"method not supported"`)
4. `calldata[:4] != SELECTOR_DIPPED_INTO_RESERVE` (reverts with `"method not supported"`)
5. `value > 0` (reverts with `"value is nonzero"`)
6. `len(calldata) > 4` (reverts with `"input is invalid"`)

### Execution semantics

On success, `dippedIntoReserve()` checks whether any account touched during the transaction is in reserve balance violation under current state, across all call depths. The call consumes 100 gas and returns an ABI-encoded Solidity `bool` (a 32-byte word with value `1` for true or `0` for false).

## Backwards compatibility

This proposal introduces a new precompile at an unallocated system address (`0x1001`) and does not modify existing opcode behavior or contract execution.

## Sources

- [Canonical MIP-4 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-4.md): proposal status (Final), precompile interface, calldata validation ordering, and gas consumption semantics.
- [Monad v0.13.0 (MONAD_NINE) release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine): MIP-4 is gated by the MONAD_NINE revision, activated at timestamp 1773153000 on testnet (March 10, 2026) and 1773930600 on mainnet (March 19, 2026).

## Discussion link

https://forum.monad.xyz/t/mip-4-reserve-balance-introspection/363
