# MIP-15: Glamsterdam EIP Activation

**Proposal status:** Review

**Network status:** Not activated on any network. The official release notes list no MIP-15 activation. Two of its EIPs have client code already: EIP-7843 (v0.15.2) and EIP-7981 (v0.16.3, gated behind the `MONAD_ETH_AMSTERDAM` revision and "not reachable on any current network").

**Verified:** October 10, 2026, against the [canonical MIP-15 specification](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-15.md) and the [official release notes](https://docs.monad.xyz/developer-essentials/changelog/releases).

## Summary

MIP-15 picks six EIPs from Ethereum's Glamsterdam upgrade (EIP-7773) for Monad and leaves the rest out. One of the six, EIP-7981, is adopted with a lower rate than Ethereum uses.

## Adopted EIPs

| EIP | What it does | Monad notes |
| --- | --- | --- |
| EIP-7708 | Nonzero-value native transfers emit a log identical to an ERC-20 `Transfer` event | Emitted from `0xfffffffffffffffffffffffffffffffffffffffe` with topic `keccak256("Transfer(address,address,uint256)")`. Applies to transactions, `CALL`, `SELFDESTRUCT`, `CREATE` and `CREATE2` that move a nonzero amount to a different account. |
| EIP-7843 | `SLOTNUM` opcode (`0x4b`, 2 gas) returns the block's slot number | On Monad the slot number is the consensus round, carried in `BlockHeader::slot_number` (v0.15.2 release notes). |
| EIP-7981 | Adds a data surcharge for access lists | Monad uses 40 gas per byte instead of Ethereum's 64: 800 gas per address and 1,280 gas per storage key. 40 matches Monad's existing calldata floor; Monad does not adopt EIP-7976, which raises Ethereum's floor to 64. |
| EIP-7997 | Requires the deterministic `CREATE2` factory at `0x4e59b44847b379578588920cA78FbF26c0B4956C` | No effect on Monad mainnet or testnet, where the factory is already deployed. Only affects local development networks. |
| EIP-8024 | `DUPN` (`0xe6`), `SWAPN` (`0xe7`), `EXCHANGE` (`0xe8`), 3 gas each | `DUP1`-`DUP16` reach the top 16 stack items and `SWAP1`-`SWAP16` the top 17. `DUPN` reaches up to item 235, `SWAPN` up to item 236. `EXCHANGE` swaps two items within the top 30. Compilers can use them to reduce "stack too deep" errors. |
| EIP-8246 | `SELFDESTRUCT` no longer burns native tokens | A contract created and self-destructed in the same transaction keeps its balance. Code, storage and nonce are still cleared. |

### Access lists and MIP-8

Under MIP-8 an access list entry warms the whole 4 KB page (128 slots) that contains the listed key, and `eth_createAccessList` deduplicates storage keys by page. With EIP-7981's per-key surcharge, listing one key per page is enough.

## EIPs Monad does not adopt

- **EIP-7928, Block-Level Access Lists.** Incompatible with asynchronous execution. Monad proposers do not execute the block they propose, so they cannot fill in an access list for it.
- **Consensus-layer EIPs** (EIP-8045, EIP-8061, EIP-8282, EIP-7688, EIP-7732). These change Ethereum's beacon chain, which Monad does not have.
- **Ethereum's two-dimensional gas model** (EIP-2780, EIP-7778, EIP-7976, EIP-8037, EIP-8038). Monad may make its own gas metering choices later.
- **EIP-7954, Increase Maximum Contract Size.** Monad's limit is already 128 KB (MIP-2).
- **Networking and informational EIPs.** Monad does not use Ethereum's devp2p protocols, and informational EIPs change no protocol behavior.

## Backwards compatibility and security

The MIP adds no compatibility or security considerations beyond those in the original EIPs.

## Sources

- [Canonical MIP-15 specification (pinned revision)](https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-15.md): proposal status, adopted and excluded EIPs, the 40 gas per byte EIP-7981 rate.
- [EIP specifications at the revision MIP-15 pins](https://github.com/ethereum/EIPs/tree/b6d3f2c65aad65bb09856db6db50ae612b8bf8aa/EIPS): opcode numbers, gas costs and log fields.
- [Monad release notes](https://docs.monad.xyz/developer-essentials/changelog/releases): EIP-7843 client support in v0.15.2, EIP-7981 gated in v0.16.3, no MIP-15 activation as of the verification date.
- [Monad opcode pricing](https://docs.monad.xyz/developer-essentials/opcode-pricing): access list entries warm the whole page under MIP-8.

## Discussion

https://forum.monad.xyz/t/mip-15-glamsterdam-eip-activation/540
