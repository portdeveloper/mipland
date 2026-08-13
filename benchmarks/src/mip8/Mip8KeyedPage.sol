// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8KeyedPage
/// @notice A separate 128-word, page-aligned record for each logical key.
/// @dev The page base is derived from both a namespace and key. Clearing the
///      lower seven hash bits reduces the collision domain from 256 to 249 bits,
///      matching MIP-8's page-index space.
library Mip8KeyedPage {
    uint256 internal constant CAPACITY = 128;

    error IndexOutOfBounds(uint256 index);
    error RangeOutOfBounds(uint256 start, uint256 count);

    struct Page {
        uint256[CAPACITY] values;
    }

    function layout(bytes32 namespace, bytes32 key) internal pure returns (Page storage self) {
        bytes32 slot = baseSlot(namespace, key);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function get(Page storage self, uint256 index) internal view returns (uint256) {
        if (index >= CAPACITY) revert IndexOutOfBounds(index);
        return self.values[index];
    }

    function set(Page storage self, uint256 index, uint256 value) internal {
        if (index >= CAPACITY) revert IndexOutOfBounds(index);
        self.values[index] = value;
    }

    function readRange(Page storage self, uint256 start, uint256 count)
        internal
        view
        returns (uint256[] memory values)
    {
        if (start > CAPACITY || count > CAPACITY - start) {
            revert RangeOutOfBounds(start, count);
        }

        values = new uint256[](count);
        for (uint256 i; i < count; ++i) {
            values[i] = self.values[start + i];
        }
    }

    function baseSlot(bytes32 namespace, bytes32 key) internal pure returns (bytes32) {
        return Mip8Pages.alignedSlot(keccak256(abi.encode(namespace, key)));
    }

    function valueSlot(Page storage self, uint256 index) internal pure returns (bytes32 slot) {
        if (index >= CAPACITY) revert IndexOutOfBounds(index);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        slot = bytes32(base + index);
    }
}
