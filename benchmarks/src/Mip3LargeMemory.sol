// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 3b — Large in-memory buffer.
///
/// MIP-3 makes 1 MB scratch memory cost ~16,400 gas instead of ~131 M gas
/// (Ethereum's quadratic formula at 32,768 words). This contract is the
/// "after": a function that allocates and fills 1 MB of memory in one tx.
/// There is no on-chain "before" — the Ethereum-formula cost is computed
/// analytically and contrasted on the suggestion card.
contract Mip3LargeMemory {
    /// Allocate a `sizeBytes`-byte buffer in memory, fill it, return a fold.
    function allocateAndFold(uint256 sizeBytes, bytes32 seed)
        external
        returns (uint256 sum)
    {
        require(sizeBytes % 32 == 0, "size must be word-aligned");
        bytes memory buf = new bytes(sizeBytes);
        uint256 words = sizeBytes / 32;
        for (uint256 i = 0; i < words; i++) {
            bytes32 chunk = keccak256(abi.encode(seed, i));
            assembly {
                mstore(add(buf, add(0x20, mul(i, 0x20))), chunk)
            }
        }
        unchecked {
            for (uint256 i = 0; i < words; i++) {
                uint256 word;
                assembly {
                    word := mload(add(buf, add(0x20, mul(i, 0x20))))
                }
                sum += word;
            }
        }
    }
}
