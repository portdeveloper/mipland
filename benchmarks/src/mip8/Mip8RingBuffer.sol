// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Mip8Pages } from "./Mip8Pages.sol";

/// @title Mip8RingBuffer
/// @notice A uint256 FIFO contained entirely within one MIP-8 page.
/// @dev Two metadata words plus 126 value words exactly fill a 128-word page.
///      Every queue operation therefore touches at most one storage page.
library Mip8RingBuffer {
    uint256 internal constant CAPACITY = 126;

    error BufferEmpty();
    error BufferFull();
    error IndexOutOfBounds(uint256 index, uint256 length);

    struct Buffer {
        uint256 head;
        uint256 length;
        uint256[CAPACITY] values;
    }

    function layout(bytes32 namespace) internal pure returns (Buffer storage self) {
        bytes32 slot = Mip8Pages.alignedSlot(namespace);
        assembly ("memory-safe") {
            self.slot := slot
        }
    }

    function push(Buffer storage self, uint256 value) internal {
        uint256 currentLength = self.length;
        if (currentLength == CAPACITY) revert BufferFull();
        self.values[(self.head + currentLength) % CAPACITY] = value;
        self.length = currentLength + 1;
    }

    function pop(Buffer storage self) internal returns (uint256 value) {
        uint256 currentLength = self.length;
        if (currentLength == 0) revert BufferEmpty();

        uint256 head = self.head;
        value = self.values[head];
        delete self.values[head];
        self.head = (head + 1) % CAPACITY;
        self.length = currentLength - 1;
    }

    function peek(Buffer storage self) internal view returns (uint256) {
        if (self.length == 0) revert BufferEmpty();
        return self.values[self.head];
    }

    function at(Buffer storage self, uint256 index) internal view returns (uint256) {
        uint256 currentLength = self.length;
        if (index >= currentLength) revert IndexOutOfBounds(index, currentLength);
        return self.values[(self.head + index) % CAPACITY];
    }

    function clear(Buffer storage self) internal {
        uint256 currentLength = self.length;
        uint256 head = self.head;
        for (uint256 i; i < currentLength; ++i) {
            delete self.values[(head + i) % CAPACITY];
        }
        self.head = 0;
        self.length = 0;
    }
}
