// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8SmallBlob
/// @notice A bytes value whose length and payload fit in one MIP-8 page.
/// @dev Slot zero stores length and slots 1 through 127 store up to 4,064
///      payload bytes. Rewrites clear storage words left behind by shorter data.
library Mip8SmallBlob {
    uint256 internal constant DATA_WORDS = 127;
    uint256 internal constant MAX_LENGTH = DATA_WORDS * 32;

    error BlobTooLarge(uint256 length);
    error WordIndexOutOfBounds(uint256 index);

    struct Blob {
        uint256 length;
    }

    function layout(bytes32 namespace) internal pure returns (Blob storage self) {
        bytes32 slot = Mip8Pages.alignedSlot(namespace);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function write(Blob storage self, bytes calldata data) internal {
        if (data.length > MAX_LENGTH) revert BlobTooLarge(data.length);

        uint256 oldWords = _wordCount(self.length);
        uint256 newWords = _wordCount(data.length);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }

        for (uint256 i; i < newWords; ++i) {
            uint256 word;
            assembly ("memory-safe") {
                word := calldataload(add(data.offset, mul(i, 0x20)))
            }

            if (i + 1 == newWords && data.length & 31 != 0) {
                uint256 usedBytes = data.length & 31;
                word &= type(uint256).max << ((32 - usedBytes) * 8);
            }
            assembly ("memory-safe") {
                sstore(add(add(base, 1), i), word)
            }
        }

        for (uint256 i = newWords; i < oldWords; ++i) {
            assembly ("memory-safe") {
                sstore(add(add(base, 1), i), 0)
            }
        }
        self.length = data.length;
    }

    function read(Blob storage self) internal view returns (bytes memory data) {
        uint256 currentLength = self.length;
        data = new bytes(currentLength);
        uint256 words = _wordCount(currentLength);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }

        for (uint256 i; i < words; ++i) {
            assembly ("memory-safe") {
                mstore(add(add(data, 0x20), mul(i, 0x20)), sload(add(add(base, 1), i)))
            }
        }
    }

    function clear(Blob storage self) internal {
        uint256 words = _wordCount(self.length);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        for (uint256 i; i < words; ++i) {
            assembly ("memory-safe") {
                sstore(add(add(base, 1), i), 0)
            }
        }
        self.length = 0;
    }

    function dataWordSlot(Blob storage self, uint256 index) internal pure returns (bytes32 slot) {
        if (index >= DATA_WORDS) revert WordIndexOutOfBounds(index);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        slot = bytes32(base + index + 1);
    }

    function _wordCount(uint256 byteLength) private pure returns (uint256) {
        return (byteLength + 31) / 32;
    }
}
