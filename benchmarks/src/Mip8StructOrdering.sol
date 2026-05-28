// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 8b — Struct field reordering for co-access.
///
/// `Scattered` separates `stake` (slot 0 of the struct) from `lastClaim`
/// (slot 128 of the struct) by 127 unrelated filler slots. MIP-8 groups
/// storage into 4 KB pages of 128 slots, so the two hot fields are
/// guaranteed to land on different pages — reading both pays two cold-page
/// loads.
///
/// `Reordered` places the two hot fields at slots 0 and 1, in the same page —
/// reading both pays one cold-page load plus one warm slot read.
///
/// Both `readPair*` functions return `stake + lastClaim`. The contract
/// stores the two layouts at distinct fixed storage roots.
contract Mip8StructOrdering {
    struct ScatteredLayout {
        uint256 stake;          // slot 0
        uint256[127] _filler;   // slots 1..127
        uint256 lastClaim;      // slot 128 — different page from stake
    }

    struct ReorderedLayout {
        uint256 stake;          // slot 0
        uint256 lastClaim;      // slot 1 — same page as stake
        uint256[127] _filler;   // slots 2..128
    }

    ScatteredLayout private scattered;
    ReorderedLayout private reordered;

    function seed(uint256 stake_, uint256 claim_) external {
        scattered.stake = stake_;
        scattered.lastClaim = claim_;
        reordered.stake = stake_;
        reordered.lastClaim = claim_;
    }

    function readPairScattered() external returns (uint256) {
        return scattered.stake + scattered.lastClaim;
    }

    function readPairReordered() external returns (uint256) {
        return reordered.stake + reordered.lastClaim;
    }
}
