# MIP-12: Decrease Vote Pace

**Status:** Draft (not live on mainnet)
**Summary:** Shortens the consensus vote pace from 400ms to 300ms, a 25%
reduction, with the related per-block parameters scaled down proportionally so
blocks arrive sooner while each one carries a little less.

## Motivation

A block every 300ms instead of every 400ms means about 33% more blocks each
second. Because each block now holds 25% fewer transactions, less gas, and
fewer bytes, the network's per-second capacity stays roughly the same: it is a
faster pipe, not a bigger one. Faster votes also mean faster confirmations and
finality.

## Specification

Vote pace leads the change, dropping from 400ms to 300ms. Four more per-block
parameters scale down with it:

- **Vote pace:** how often validators vote on a block. Lower means faster
  confirmations and finality. Drops from 400ms to 300ms.
- **Transactions per block:** the most transactions that can be packed into a
  single block. Scales down proportionally.
- **Compute per block (gas):** the total computation a block is allowed to do,
  where gas is the EVM's unit for compute. Scales down proportionally.
- **Data per block (bytes):** the largest a single block can get, measured in
  bytes. Scales down proportionally.
- **Block reward:** the MON paid to the validator that proposes a block. Shrinks
  for the same reason, since blocks are smaller and more frequent.

## Backwards compatibility

This is a consensus-layer change only. The execution layer is unaffected and
existing contracts behave exactly as before. Activating it requires a hard fork
on the consensus client.

## Discussion link

https://mipland.org/mip-12
