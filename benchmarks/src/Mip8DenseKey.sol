// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 8a — Dense-key lookup.
///
/// Before: a `mapping(uint256 => uint256)`. Each key hashes to a slot scattered
///         across the storage space; consecutive logical indices land on
///         different MIP-8 pages, so each read pays cold-page cost.
/// After:  a `uint256[256]` fixed array. Consecutive indices land in adjacent
///         slots, so a read of N entries pays 1 cold-page + (N-1) warm.
///
/// Both functions read 8 consecutive entries and return the sum. Storage is
/// initialized in the constructor so both halves are reading non-zero, warm
/// values — the only variable is the storage *layout*.
contract Mip8DenseKey {
    mapping(uint256 => uint256) private scattered;
    uint256[256] private packed;

    constructor() {
        for (uint256 i = 0; i < 256; i++) {
            scattered[i] = i + 1;
            packed[i] = i + 1;
        }
    }

    function readScattered(uint256 start) external returns (uint256 sum) {
        for (uint256 i = 0; i < 8; i++) {
            sum += scattered[start + i];
        }
    }

    function readPacked(uint256 start) external returns (uint256 sum) {
        for (uint256 i = 0; i < 8; i++) {
            sum += packed[start + i];
        }
    }
}
