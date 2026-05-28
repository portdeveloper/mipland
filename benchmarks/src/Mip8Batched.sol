// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 8c — Batched state growth.
///
/// MIP-8 charges STATE_GROWTH_COST (17,000) per page that newly grows, not per
/// slot. Writing 10 fresh entries into 10 keccak-scattered mapping slots pays
/// 10 × growth. Writing 10 fresh entries into 10 adjacent array slots pays
/// 1 × growth + 9 × warm-write.
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
