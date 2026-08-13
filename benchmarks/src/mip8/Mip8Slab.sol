// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8Slab
/// @notice A page-local allocator for 126 fixed-size uint256 records.
/// @dev Slot zero is an occupancy bitmap, slot one is the live-record count,
///      and slots 2 through 127 contain records. Deleted indices are reused.
library Mip8Slab {
    uint256 internal constant CAPACITY = 126;

    error SlabFull();
    error RecordNotFound(uint256 index);

    struct Slab {
        uint256 occupied;
        uint256 length;
        uint256[CAPACITY] values;
    }

    function layout(bytes32 namespace) internal pure returns (Slab storage self) {
        bytes32 slot = Mip8Pages.alignedSlot(namespace);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function insert(Slab storage self, uint256 value) internal returns (uint256 index) {
        if (self.length == CAPACITY) revert SlabFull();

        uint256 occupied = self.occupied;
        while (occupied & (uint256(1) << index) != 0) {
            unchecked {
                ++index;
            }
        }

        self.values[index] = value;
        self.occupied = occupied | (uint256(1) << index);
        self.length += 1;
    }

    function remove(Slab storage self, uint256 index) internal returns (uint256 value) {
        _requireOccupied(self, index);
        value = self.values[index];
        delete self.values[index];
        self.occupied &= ~(uint256(1) << index);
        self.length -= 1;
    }

    function get(Slab storage self, uint256 index) internal view returns (uint256) {
        _requireOccupied(self, index);
        return self.values[index];
    }

    function set(Slab storage self, uint256 index, uint256 value) internal {
        _requireOccupied(self, index);
        self.values[index] = value;
    }

    function contains(Slab storage self, uint256 index) internal view returns (bool) {
        return index < CAPACITY && self.occupied & (uint256(1) << index) != 0;
    }

    function valueSlot(Slab storage self, uint256 index) internal pure returns (bytes32 slot) {
        if (index >= CAPACITY) revert RecordNotFound(index);
        uint256 base;
        assembly ("memory-safe") {
            base := self.slot
        }
        slot = bytes32(base + 2 + index);
    }

    function _requireOccupied(Slab storage self, uint256 index) private view {
        if (!contains(self, index)) revert RecordNotFound(index);
    }
}
