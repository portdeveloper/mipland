// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 3a — Mid-tx scratchpad.
///
/// Before: a contract uses a storage array as a within-tx scratchpad,
/// writing 64 intermediate values then reading them back to fold a result.
/// After:  the same 64 values are held entirely in memory.
///
/// On Monad with MIP-3 (linear memory), the memory variant costs effectively
/// nothing per word. The storage variant still pays SSTORE + state growth +
/// page-warm reads. Both functions return the same value.
contract Mip3Scratchpad {
    bytes32[64] private scratch;

    function runBefore(bytes32 seed) external returns (uint256 sum) {
        for (uint256 i = 0; i < 64; i++) {
            scratch[i] = keccak256(abi.encode(seed, i));
        }
        unchecked {
            for (uint256 i = 0; i < 64; i++) {
                sum += uint256(scratch[i]);
            }
        }
    }

    function runAfter(bytes32 seed) external returns (uint256 sum) {
        bytes32[64] memory mem;
        for (uint256 i = 0; i < 64; i++) {
            mem[i] = keccak256(abi.encode(seed, i));
        }
        unchecked {
            for (uint256 i = 0; i < 64; i++) {
                sum += uint256(mem[i]);
            }
        }
    }
}
