# MIP-8 reference data structures

Experimental, unaudited Solidity primitives that keep related state in
MIP-8's 128-word (4 KB) storage pages.

| Primitive | Layout | Useful for |
|---|---|---|
| `Mip8DenseBitmap` | 128 adjacent bitmap words per page (32,768 bits) | Dense IDs, claims, permissions, epochs |
| `Mip8Uint256Vector` | Length plus 127 values in page zero, then 128 values per page | Append-heavy records and batched sequential reads |
| `Mip8RingBuffer` | Two metadata words plus 126 values in exactly one page | Bounded queues, rolling observations, recent events |
| `Mip8KeyedPage` | One independently aligned 128-word page per logical key | Accounts, markets, positions, co-accessed entity fields |
| `Mip8Slab` | Occupancy + count + 126 reusable records in one page | Orders, jobs, game entities, bounded allocators |
| `Mip8Uint64Vector` | Length plus 508 packed values in page zero, then 512 per page | Timestamps, counters, compact prices and IDs |
| `Mip8SmallBlob` | Length plus up to 4,064 bytes in one page | Metadata, encoded configs, bounded payloads |

`Mip8Pages` derives a namespaced storage base whose lower seven bits are zero.
This makes page boundaries explicit and prevents a primitive from accidentally
starting near the end of a page.

## Example

```solidity
import {Mip8DenseBitmap} from "./Mip8DenseBitmap.sol";

contract Claims {
    using Mip8DenseBitmap for Mip8DenseBitmap.Bitmap;

    bytes32 private constant CLAIMS = keccak256("example.claims.bitmap");

    function claim(uint256 id) external {
        bool newlyClaimed = Mip8DenseBitmap.layout(CLAIMS).set(id);
        require(newlyClaimed, "already claimed");
    }

    function isClaimed(uint256 id) external view returns (bool) {
        return Mip8DenseBitmap.layout(CLAIMS).get(id);
    }
}
```

Use a unique namespace for every primitive in a contract. These libraries use
unstructured namespaced storage, so reusing a namespace aliases the same state.

`Mip8KeyedPage` additionally derives a page from each key. Its aligned page
index has 249 bits of collision resistance, the same key-space width MIP-8
defines for page indices. As with ordinary mapping storage, applications rely
on cryptographic collision resistance rather than checking collisions on-chain.

## Layout guarantees

- `Mip8KeyedPage` indices 0 through 127 occupy one complete aligned page.
- `Mip8Slab` stores its bitmap and count at offsets 0 and 1; all 126 records
  occupy offsets 2 through 127. Removing a record frees its index for reuse.
- `Mip8Uint64Vector` packs four values per word without changing neighboring
  values. Values 0 through 507 share the page containing the length field.
- `Mip8SmallBlob` supports at most 4,064 bytes so its length and all 127 data
  words remain within one page. Shorter rewrites clear obsolete trailing words.

## What MIP-8 improves

MIP-8 makes the first access to a 128-slot page cold and later accesses to any
slot in that page warm for the transaction. These structures improve locality
when a call touches several nearby values. A single lookup is not expected to
be cheaper merely because it uses one of these libraries.

State-growth cost is still based on the number of newly occupied slots. Dense
layout amortizes page I/O; it does not make arbitrary state growth free.

Vanilla Foundry can verify behavior and storage layout but does not model the
MIP-8 gas schedule. Use Monad's MIP-8-enabled Foundry build or an MIP-8-enabled
network to benchmark page-warming gas effects.
