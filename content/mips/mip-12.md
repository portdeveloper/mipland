# MIP-12: Decrease Block Time

**Proposal status:** Final

**Network status:** Activated on Monad mainnet at round 89,758,000 (July 23, 2026, approximately 14:30 UTC).

**Verified:** October 4, 2026, against the [canonical MIP-12 specification](https://github.com/monad-crypto/MIPs/blob/2a7e18894f1e55fb043080cb8cef15c7f5647768/MIPs/MIP-12.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-15-1).

## Summary

MIP-12 is a Final consensus-layer change that reduced the target vote pace from 400ms to 300ms. The mainnet activation was recorded at round 89,758,000. The 300ms figure describes the protocol's target cadence; it does not guarantee a particular observed block latency or time to finality.

## Parameter changes

| Parameter | Before | After | Change |
| --- | ---: | ---: | --- |
| Target vote pace | 400ms | 300ms | 25% shorter |
| Transactions per block | 5,000 | 3,750 | 25% lower |
| Proposal gas limit | 200,000,000 | 150,000,000 | 25% lower |
| Proposal byte limit | 2,000,000 bytes | 1,500,000 bytes | 25% lower |
| Block reward | 25 MON | 18 MON | 28% lower |

At the nominal target cadence, the transaction, gas, and byte limits per second stay the same: 12,500 transactions, 500 million gas, and 5 million bytes per second. The reward rate changes from 62.5 to 60 MON per second at those nominal rates; it is not unchanged.

## Scope and interpretation

The MIP changes consensus parameters and does not change execution-layer behavior. A shorter target vote pace is not a measurement of observed block latency or finality, which can vary with network conditions.

## Sources

- [Canonical MIP-12 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/2a7e18894f1e55fb043080cb8cef15c7f5647768/MIPs/MIP-12.md) — proposal status and parameter values.
- [Monad v0.15.1 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-15-1) — mainnet activation round and date.
- [Monad v0.15.0 release notes](https://docs.monad.xyz/developer-essentials/changelog/releases#v0-15-0) — testnet activation at round 43,821,000 (approximately July 9, 2026, 14:30 UTC).

## Discussion

https://forum.monad.xyz/t/mip-12-decrease-vote-pace/488
