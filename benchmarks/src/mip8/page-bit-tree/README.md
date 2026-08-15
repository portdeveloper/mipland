# Does a summary level earn its place?

A controlled experiment on one design decision, and a harness for measuring that class of
question under MIP-8.

`Mip8DenseBitmap` holds 32,768 bits in one page. Past that you need many pages, and then you
have to decide whether to put an index on top of them. Both structures here span the full
`uint24` id space with page-aligned leaves; they differ in exactly one thing.

| | levels | summary |
|---|---|---|
| `FlatBitmap` | 1 | none — `slot = BASE + (id >> 8)`, 65,536 words |
| `PageBitTree` | 2 | a 2-word root, one bit per leaf, on the application's header page |

The root is given every advantage: it is only two words, and it sits at slot 7 on page 0
alongside a header the caller reads anyway, so reading it costs 100 rather than 8,100.

## Result

Measured under MIP-8, cold storage, harness overhead subtracted. Negative = flat is cheaper.

**Every write.** The flat bitmap wins or ties all of them.

| operation | 2-level | 1-level | delta |
|---|---|---|---|
| insert, id already present | 16,882 | **16,840** | −42 |
| insert, live word | 19,797 | **19,744** | −53 |
| insert, new word | 37,089 | **36,844** | −245 |
| insert, new page | 40,001 | **36,844** | −3,157 |
| insert, first id ever | 57,101 | **36,844** | −20,257 |
| remove, id not present | 16,840 | **16,820** | −20 |
| remove, word survives | 19,776 | **19,724** | −52 |
| remove, word empties | 20,055 | **19,724** | −331 |
| remove, **last id in page** | 59,276 | **19,724** | **−39,552** |

Each margin is the root and nothing else:

- **−42** — one warm `SLOAD`. Page 0 was already charged by the header read.
- **−3,157** — setting a leaf's bit is the first write to page 0 this transaction: `2800 + 100`.
- **−20,257** — the root word itself is a net-new nonzero slot: `+17,100` on top.
- **−39,552** — clearing a root bit is only legal once the leaf is proven empty, and with no
  index inside the leaf that proof is a **128-word scan**.

That last row is the one to take away. Maintaining a summary is not just the cost of writing
it; it is the cost of *proving* you are allowed to write it. A structure with no invariant has
nothing to propagate and nothing to prove, which is why `FlatBitmap.add` and `.remove` are
unconditionally one read and one write regardless of where the id lands.

**Search**, one id at a widening gap below the probe:

| gap | 2-level | 1-level |
|---|---|---|
| 1 word | 17,220 | **16,985** |
| 40 words | 25,059 | **24,824** |
| 128 words | 51,407 | **50,512** |
| 200 words | 65,879 | **64,984** |
| 256 words | **51,407** | 84,240 |
| 400 words | **54,623** | 121,184 |
| 600 words | **69,095** | 169,384 |

Crossover is ~256 words. Below it the walk is short enough that the root's own overhead makes
it a net loss; above it the flat bitmap pays ~201 a word plus 8,100 every page boundary it
crosses, while the root turns the same jump into a bitmap lookup at roughly constant cost. The
2-level column is not monotonic in the gap because the root lets it skip whole empty leaves,
so the work depends on how the gap divides into leaves rather than on its width.

## Reading it

**A summary level costs you on every write and only pays back in a tail.** Whether to keep one
is a question about your gap distribution, not about the data structure. Measure the largest
gap you actually search across:

- gaps below ~65,000 ids — drop the root; it charges 42–39,552 gas per write for nothing
- gaps above that, or an unbounded not-found path — keep it

The one thing the flat bitmap cannot do cheaply is answer "there is nothing below here". With
no summary, `findFirstRight` past the last set id walks the entire domain — ~13M gas against
~200 with a root. If callers can reach that, either bound the walk to a fixed word budget or
keep the root purely for that case. Do not keep it to make ordinary searches faster; it does
not.

`CLZ` (Osaka, 5 gas) replaces a binary-search `msb`/`lsb` cascade in both structures:
`_msb(x) = 255 - clz(x)`, `_lsb(x) = 255 - clz(x & -x)`.

## Running it

```sh
forge test --match-path "test/PageBitTree.t.sol"        # correctness, vanilla revm
FOUNDRY_PROFILE=mip8 forge test \
  --match-path "test/PageBitTreeGas.t.sol" -vv          # the numbers above
```

The gas suite needs [Monad's Foundry build](https://github.com/category-labs/foundry). Under
plain `forge test` it **skips**, so the repo's default run stays green. Under
`FOUNDRY_PROFILE=mip8` without that build it **fails loudly**, because asking for MIP-8 and
silently getting vanilla is what produces confident wrong numbers — it inverts most rows here
rather than merely shifting them.

Correctness runs anywhere: behaviour and storage layout do not depend on the gas schedule. The
two structures are independent implementations of the same abstract set, so they serve as each
other's differential oracle, with a brute-force oracle pinning both to ground truth.

## The measurement rules

Four things silently produce confident wrong numbers when benchmarking storage under MIP-8.
Each of these cost a wrong conclusion here before it was caught, and none of them announce
themselves — the suite still runs, still passes, and still prints internally consistent
figures.

1. **Storage touched in a test body stays warm for the rest of that body.** Seeding has to
   happen in `setUp`. That is why the gas file is one contract per scenario rather than one
   contract with many test functions.
2. **Reading a contract-typed state variable is an `SLOAD` inside the measured window.** Two
   such fields are usually adjacent slots on one page, so the harness's own storage dominates
   the delta and swamps whatever you meant to measure. Hoist addresses into locals first.
3. **`vm.startStateDiffRecording()` warms storage.** Gas and access counts cannot come from the
   same call. Relatedly, **solc deletes an `SLOAD` whose result is unused**, so a warm-up read
   is optimised away unless it ends in something observable — a conditional revert works.
4. **A scanned word costs ~201, not the 100 the schedule implies.** The extra is loop compute.
   Negligible for O(1) work, half the cost of an O(k) scan, and it decides every wide-gap row.

A fifth is specific to libraries: **`constant` inlines the expression, not the value**, and
solc does not always fold it. Writing the geometry constants as derivations (`BITS_PER_LEAF -
1` and so on) cost 81 gas per operation. They are literals here, with the derivations asserted
in `test_geometryIsExact`.

The harness exists for the same reason. Calling a library directly measures it in isolation,
which is not how it gets paid for: under MIP-8 the cost of a structure depends on which pages
the surrounding contract has already warmed. `Harness.sol` embeds both structures in a real
storage layout taken from a deployed contract via `forge inspect`, so the co-location effect is
measured rather than assumed. Both harnesses declare the same variables in the same order, so
the comparison is like-for-like.

## Limitations

- Unaudited, experimental, consistent with the rest of `src/mip8`.
- The layout in `Harness.sol` is typical, not universal. If your contract has spare slots on
  its header page you have more freedom; if its index shares a page with nothing hot, the
  co-location result does not transfer. One `forge inspect` settles it.
- Remove figures are gross — refunds for clearing slots are not netted out. Both structures.
- With the root on the application's page, an out-of-range leaf index would corrupt live state
  rather than aliasing harmlessly. The scans are hard-bounded and asserted.
- An id space centred on a power of two puts the centre on the first bit of a leaf
  (`2^23 mod 32768 = 0`), so every search from it misses the first stage. A per-deployment
  bias constant costs ~6 gas.
- The crossover is a gas result, not a claim about any particular application's gap
  distribution. That has to be measured against real data.
