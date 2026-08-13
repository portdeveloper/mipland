// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 8c — Batched page writes.
///
/// MIP-8 charges page I/O once per page touched, while STATE_GROWTH_COST remains
/// tied to each net-new occupied slot. Writing 10 fresh entries into 10
/// keccak-scattered mapping slots pays 10 cold page loads and 10 page-write
/// charges. Writing 10 adjacent array slots amortizes those I/O charges across
/// one page. Both layouts still pay state-growth cost for all 10 new slots.
///
/// Both functions write 10 fresh entries starting from offset 0 (the test /
/// deploy script ensures the relevant range is zero before the call).
contract Mip8Batched {
    mapping(uint256 => uint256) private scattered;
    uint256[1024] private packed;

    function writeScattered(uint256 count, uint256 base) external {
        for (uint256 i = 0; i < count; i++) {
            scattered[i] = base + i;
        }
    }

    function writePacked(uint256 count, uint256 base) external {
        for (uint256 i = 0; i < count; i++) {
            packed[i] = base + i;
        }
    }
}
