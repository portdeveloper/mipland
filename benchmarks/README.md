# mipland benchmarks

Solidity benchmarks that produce the on-chain proofs cited by the Suggestions
section on `/mip-3` and `/mip-4`. Each published suggestion's gas number or
behavioral proof comes from a real Monad-mainnet transaction whose hash is
linked from the card.

The MIP-8 contracts are experimental fixtures for the page-aware gas schedule.
MIP-8 activated on Monad mainnet on September 2, 2026 at 14:30 UTC. Only
transactions mined after that timestamp are valid mainnet MIP-8 measurements.

## What's here

| Pattern | Contract | What it proves |
|---|---|---|
| 3a | `src/Mip3Scratchpad.sol` | Storage-as-scratchpad vs memory-as-scratchpad, 1 KB of intermediate state |
| 3b | `src/Mip3LargeMemory.sol` | 1 MB memory allocation on Monad (~16 k gas) vs ETH quadratic (~2.3 M gas analytical) |
| 8a | `src/Mip8DenseKey.sol` | `mapping(uint=>uint)` vs `uint256[]` for 8 dense-key reads |
| 8b | `src/Mip8StructOrdering.sol` | Co-accessed struct fields on separate pages vs adjacent slots |
| 8c | `src/Mip8Batched.sol` | 10 fresh writes scattered across pages vs into one page |
| 4a | `src/Mip4Bundler.sol` | Bundler that uses MIP-4 precompile to surface offending UserOp vs naive bundler |

## Reusable MIP-8 primitives

`src/mip8/` contains experimental, unaudited reference data structures built
around explicit 128-slot page alignment:

- `Mip8DenseBitmap` — consecutive bitmap words instead of mapping-hashed buckets
- `Mip8Uint256Vector` — sequential values with batch append/read operations
- `Mip8RingBuffer` — a bounded 126-value FIFO contained in one page
- `Mip8KeyedPage` — a separate aligned 128-word record for each logical key
- `Mip8Slab` — bitmap allocation and 126 reusable records in one page
- `Mip8Uint64Vector` — four packed values per slot and 508 in the first page
- `Mip8SmallBlob` — a length-prefixed payload of up to 4,064 bytes in one page
- `page-bit-tree/` — a bitmap spanning many pages, measured with and without a summary level

See [`src/mip8/README.md`](src/mip8/README.md) for usage and limitations.

## Local checks (vanilla revm — does NOT verify MIP gas math)

```sh
forge build
forge test -vv
```

`src/mip8/page-bit-tree` additionally ships a gas benchmark that DOES model the MIP-8
schedule, using Monad's Foundry build. It skips under vanilla `forge test`, so the command
above stays green:

```sh
FOUNDRY_PROFILE=mip8 forge test --match-path "test/PageBitTreeGas.t.sol" -vv
```

The Foundry test suite only verifies that each before/after pair produces the
same logical result (or, for 4a, attempts to invoke the precompile). It cannot
verify the MIP-3 / MIP-8 gas relations because `forge` runs vanilla revm
without Monad's custom gas schedule. Post-activation mainnet or testnet
transactions are required to verify MIP-8 gas relations.

## Mainnet deploy + measure

Prerequisites:

- `MONAD_RPC_URL` — defaults to `https://rpc.monad.xyz`
- `PRIVATE_KEY` — funded with enough MON for six deployments and the benchmark
  calls

```sh
cp .env.example .env
# edit .env with your key
source .env

forge script script/DeployAndMeasure.s.sol \
  --rpc-url "$MONAD_RPC_URL" \
  --broadcast \
  --slow

node script/postprocess.mjs 143
# → writes measurements.json at the repo root
```

The script:

1. Deploys 6 benchmark contracts.
2. Calls each before/after method once, including the MIP-8 fixtures.
3. Foundry writes `broadcast/DeployAndMeasure.s.sol/143/run-latest.json` with
   per-tx receipts.
4. `postprocess.mjs` reads that log, pairs CALLs with receipts, and produces
   `measurements.json`, including the post-activation MIP-8 calls.

## Re-running

If a suggestion's number looks wrong, change the contract, redeploy, and the
UI will pick up the new measurements.json on the next build.

## Why not just compute gas locally?

Foundry's gas reporting uses revm with Ethereum's gas schedule. MIP-3
(linear memory) and MIP-8 (paged storage) use different schedules in the
Monad client. Accurate MIP-8 numbers must come from post-activation Monad
mainnet or testnet transactions.
