# MIP-3: Linear Memory

**Proposal status:** Final

**Network status:** Activated with the MONAD_NINE upgrade on Monad mainnet on March 19, 2026, 14:30 UTC, and on testnet on March 10, 2026, 14:30 UTC.

**Verified:** October 4, 2026, against the [canonical MIP-3 specification](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-3.md) and the [official v0.13.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine).

## Summary

MIP-3 replaces the EVM's quadratic memory expansion pricing with a linear cost model and enforces a shared 8 MB active-memory pool across nested frames per transaction. Rather than each frame receiving an independent 8 MB allowance, remaining allocation is tracked against this shared pool (e.g., a parent holding 3 MB leaves at most 5 MB for its child); exceeding remaining memory causes an exceptional halt that consumes all gas in the call frame.

## Motivation

Standard EVM memory pricing grows quadratically with size alongside the 63/64 gas rule, leading to theoretical transaction limits around 26 MB while overcharging for realistic workloads. Historical mainnet transactions average ~2 KB of memory with a maximum observed usage near ~2 MB. The quadratic formula heavily penalizes algorithms that benefit from large in-memory buffers (such as Merkle trees, zero-knowledge verifiers, and batch processing). MIP-3 aligns pricing with physical resource consumption, making memory expansion predictable and economical.

## Specification

### Cost model

Memory expansion cost is strictly linear in the number of 32-byte words allocated:

```python
memory_size_words = (memory_byte_size + 31) // 32
memory_cost = memory_size_words // 2
```

Expanding memory to the full 8 MB ceiling costs 131,072 gas (262,144 words divided by 2). For a typical 2 KB allocation (64 words), the cost is 32 gas instead of roughly 200 gas under the quadratic model.

### Shared 8 MB active-memory pool across nested frames

Total active memory across the transaction is bounded by a shared 8 MB pool (8,388,608 bytes) across nested frames, rather than each frame having an independent 8 MB allowance. For example, a parent holding 3 MB leaves at most 5 MB for its child call. Allocation is bounded across nested call contexts:

1. Let `k` be memory used by the current call frame, and `j` be memory used by ancestor call frames.
2. The remaining memory available to a child call is:
   ```python
   remaining_memory = 8 * 1024 * 1024 - j - k
   ```
3. When a child call completes and returns, its allocated memory is returned to the pool for subsequent calls in the transaction.

### Exceptional-halt gas behavior

If an operation in a call frame attempts to allocate memory exceeding `remaining_memory`, execution halts exceptionally, consuming all gas remaining in that call frame:
- All gas remaining in that call frame is consumed.
- The failure is an exceptional halt (out-of-gas condition), not a Solidity-level revert, so no returndata is produced.
- Parent call frames handle the failure under standard EVM call-failure semantics.

## Backwards compatibility

Standard EVM opcodes that read, write, or copy memory (`MLOAD`, `MSTORE`, `MSTORE8`, `MCOPY`, `CALLDATACOPY`, `CODECOPY`, `RETURNDATACOPY`, `EXTCODECOPY`, `KECCAK256`, `LOG0`-`LOG4`, `CREATE`, `CREATE2`, `CALL`, `RETURN`, `REVERT`) preserve their functional semantics. ERC-4337 account abstraction contracts remain fully compatible because memory allocated in child execution is reclaimed upon completion.

The only breaking change is for contracts attempting to allocate more than 8 MB of memory in a transaction, which now halt exceptionally rather than succeeding or reverting with custom data.

## Sources

- [Canonical MIP-3 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-3.md): proposal status (Final), linear cost formula, 8 MB limit, and exceptional halt specification.
- [Monad v0.13.0 (MONAD_NINE) release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-13-0-monad_nine): MIP-3 is gated by the MONAD_NINE revision, activated at timestamp 1773153000 on testnet (March 10, 2026) and 1773930600 on mainnet (March 19, 2026).

## Discussion link

https://forum.monad.xyz/t/mip-3-linear-evm-memory-cost/362
