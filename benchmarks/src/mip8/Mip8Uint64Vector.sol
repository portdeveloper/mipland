// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8Uint64Vector
/// @notice A page-aligned vector packing four uint64 values into each slot.
/// @dev Page zero holds length plus 508 values. Each later page holds 512
///      values. This is useful when 64 bits are sufficient for timestamps,
///      counters, compact prices, or IDs.
library Mip8Uint64Vector {
    uint256 internal constant VALUES_PER_WORD = 4;
    uint256 internal constant VALUE_BITS = 64;
    uint256 internal constant VALUE_MASK = type(uint64).max;

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

    function get(Vector storage self, uint256 index) internal view returns (uint64) {
        uint256 currentLength = self.length;
        if (index >= currentLength) revert IndexOutOfBounds(index, currentLength);
        return _get(self, index);
    }

    function set(Vector storage self, uint256 index, uint64 value) internal {
        uint256 currentLength = self.length;
        if (index >= currentLength) revert IndexOutOfBounds(index, currentLength);
        _set(self, index, value);
    }

    function push(Vector storage self, uint64 value) internal {
        uint256 index = self.length;
        _set(self, index, value);
        self.length = index + 1;
    }

    function pushMany(Vector storage self, uint64[] calldata values) internal {
        uint256 start = self.length;
        uint256 newLength = start + values.length;
        for (uint256 i; i < values.length; ++i) {
            _set(self, start + i, values[i]);
        }
        self.length = newLength;
    }

    function pop(Vector storage self) internal returns (uint64 value) {
        uint256 currentLength = self.length;
        if (currentLength == 0) revert EmptyVector();

        uint256 index = currentLength - 1;
        value = _get(self, index);
        _set(self, index, 0);
        self.length = index;
    }

    function readRange(Vector storage self, uint256 start, uint256 count)
        internal
        view
        returns (uint64[] memory values)
    {
        uint256 currentLength = self.length;
        if (start > currentLength || count > currentLength - start) {
            revert IndexOutOfBounds(start + count, currentLength);
        }

        values = new uint64[](count);
        for (uint256 i; i < count; ++i) {
            values[i] = _get(self, start + i);
        }
    }

    function wordSlot(Vector storage self, uint256 index) internal pure returns (bytes32 slot) {
        uint256 wordIndex = index / VALUES_PER_WORD;
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        if (wordIndex >= type(uint256).max - base) revert SlotOverflow();
        slot = bytes32(base + wordIndex + 1);
    }

    function _get(Vector storage self, uint256 index) private view returns (uint64 value) {
        bytes32 slot = wordSlot(self, index);
        uint256 word;
        assembly ("memory-safe") {
            word := sload(slot)
        }
        value = uint64(word >> ((index % VALUES_PER_WORD) * VALUE_BITS));
    }

    function _set(Vector storage self, uint256 index, uint64 value) private {
        bytes32 slot = wordSlot(self, index);
        uint256 shift = (index % VALUES_PER_WORD) * VALUE_BITS;
        uint256 word;
        assembly ("memory-safe") {
            word := sload(slot)
        }
        word = (word & ~(VALUE_MASK << shift)) | (uint256(value) << shift);
        assembly ("memory-safe") {
            sstore(slot, word)
        }
    }
}
