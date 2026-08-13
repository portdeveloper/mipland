// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8DenseBitmap
/// @notice A page-local bitmap for dense integer keys.
/// @dev Unlike mapping(uint256 => uint256)-backed bitmaps, consecutive bitmap
///      words occupy consecutive storage slots. One MIP-8 page therefore holds
///      32,768 bits (128 words * 256 bits).
library Mip8DenseBitmap {
    error SlotOverflow();

    /// @dev The field anchors the storage pointer. Words are accessed directly
    ///      from `self.slot + wordIndex` and are not Solidity mapping entries.
    struct Bitmap {
        uint256 _word0;
    }

    function layout(bytes32 namespace) internal pure returns (Bitmap storage self) {
        bytes32 slot = Mip8Pages.alignedSlot(namespace);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function get(Bitmap storage self, uint256 bitIndex) internal view returns (bool) {
        (bytes32 slot, uint256 mask) = _location(self, bitIndex);
        uint256 word;
        assembly ("memory-safe") {
            word := sload(slot)
        }
        return word & mask != 0;
    }

    /// @return changed True when the bit changed from zero to one.
    function set(Bitmap storage self, uint256 bitIndex) internal returns (bool changed) {
        (bytes32 slot, uint256 mask) = _location(self, bitIndex);
        uint256 word;
        assembly ("memory-safe") {
            word := sload(slot)
        }
        changed = word & mask == 0;
        if (changed) {
            assembly ("memory-safe") {
                sstore(slot, or(word, mask))
            }
        }
    }

    /// @return changed True when the bit changed from one to zero.
    function unset(Bitmap storage self, uint256 bitIndex) internal returns (bool changed) {
        (bytes32 slot, uint256 mask) = _location(self, bitIndex);
        uint256 word;
        assembly ("memory-safe") {
            word := sload(slot)
        }
        changed = word & mask != 0;
        if (changed) {
            assembly ("memory-safe") {
                sstore(slot, and(word, not(mask)))
            }
        }
    }

    function setTo(Bitmap storage self, uint256 bitIndex, bool value)
        internal
        returns (bool changed)
    {
        return value ? set(self, bitIndex) : unset(self, bitIndex);
    }

    /// @notice Returns the physical storage slot containing `bitIndex`.
    /// @dev Exposed for layout inspection, access-list generation, and tests.
    function wordSlot(Bitmap storage self, uint256 bitIndex) internal pure returns (bytes32) {
        return _slotAt(self, bitIndex >> 8);
    }

    function _location(Bitmap storage self, uint256 bitIndex)
        private
        pure
        returns (bytes32 slot, uint256 mask)
    {
        slot = _slotAt(self, bitIndex >> 8);
        mask = uint256(1) << (bitIndex & 0xff);
    }

    function _slotAt(Bitmap storage self, uint256 wordIndex) private pure returns (bytes32 slot) {
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        if (wordIndex > type(uint256).max - base) revert SlotOverflow();
        slot = bytes32(base + wordIndex);
    }
}
