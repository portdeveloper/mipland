// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8Uint256Vector
/// @notice A namespaced vector whose elements occupy consecutive storage slots.
/// @dev Slot zero of the first page stores length. The first 127 elements share
///      that page; every subsequent full page holds 128 elements. Batch calls
///      amortize MIP-8's cold-page I/O charge across adjacent values.
library Mip8Uint256Vector {
    error IndexOutOfBounds(uint256 index, uint256 length);
    error EmptyVector();
    error SlotOverflow();

    struct Vector {
        uint256 length;
    }

    function layout(bytes32 namespace) internal pure returns (Vector storage self) {
        bytes32 slot = Mip8Pages.alignedSlot(namespace);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function get(Vector storage self, uint256 index) internal view returns (uint256 value) {
        uint256 currentLength = self.length;
        if (index >= currentLength) revert IndexOutOfBounds(index, currentLength);
        bytes32 slot = elementSlot(self, index);
        assembly ("memory-safe") {
            value := sload(slot)
        }
    }

    function set(Vector storage self, uint256 index, uint256 value) internal {
        uint256 currentLength = self.length;
        if (index >= currentLength) revert IndexOutOfBounds(index, currentLength);
        bytes32 slot = elementSlot(self, index);
        assembly ("memory-safe") {
            sstore(slot, value)
        }
    }

    function push(Vector storage self, uint256 value) internal {
        uint256 index = self.length;
        bytes32 slot = elementSlot(self, index);
        assembly ("memory-safe") {
            sstore(slot, value)
        }
        self.length = index + 1;
    }

    /// @notice Append a batch in sequential slots.
    function pushMany(Vector storage self, uint256[] calldata values) internal {
        uint256 start = self.length;
        uint256 newLength = start + values.length;

        for (uint256 i; i < values.length; ++i) {
            bytes32 slot = elementSlot(self, start + i);
            uint256 value = values[i];
            assembly ("memory-safe") {
                sstore(slot, value)
            }
        }
        self.length = newLength;
    }

    function pop(Vector storage self) internal returns (uint256 value) {
        uint256 currentLength = self.length;
        if (currentLength == 0) revert EmptyVector();

        uint256 index = currentLength - 1;
        bytes32 slot = elementSlot(self, index);
        assembly ("memory-safe") {
            value := sload(slot)
            sstore(slot, 0)
        }
        self.length = index;
    }

    /// @notice Read a logically contiguous range.
    /// @dev The range may span pages; each additional page incurs one cold page
    ///      touch under MIP-8. Prefer page-sized or naturally bounded batches.
    function readRange(Vector storage self, uint256 start, uint256 count)
        internal
        view
        returns (uint256[] memory values)
    {
        uint256 currentLength = self.length;
        if (start > currentLength || count > currentLength - start) {
            revert IndexOutOfBounds(start + count, currentLength);
        }

        values = new uint256[](count);
        for (uint256 i; i < count; ++i) {
            bytes32 slot = elementSlot(self, start + i);
            uint256 value;
            assembly ("memory-safe") {
                value := sload(slot)
            }
            values[i] = value;
        }
    }

    /// @notice Returns the physical storage slot containing element `index`.
    /// @dev Does not require the element to exist, which makes this useful for
    ///      inspecting layout and preparing access lists.
    function elementSlot(Vector storage self, uint256 index) internal pure returns (bytes32 slot) {
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        if (index >= type(uint256).max - base) revert SlotOverflow();
        slot = bytes32(base + index + 1);
    }
}
