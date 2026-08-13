// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Test } from "forge-std/Test.sol";
import { Mip8Pages } from "../src/mip8/Mip8Pages.sol";
import { Mip8DenseBitmap } from "../src/mip8/Mip8DenseBitmap.sol";
import { Mip8Uint256Vector } from "../src/mip8/Mip8Uint256Vector.sol";
import { Mip8RingBuffer } from "../src/mip8/Mip8RingBuffer.sol";

contract Mip8CollectionsHarness {
    using Mip8DenseBitmap for Mip8DenseBitmap.Bitmap;
    using Mip8Uint256Vector for Mip8Uint256Vector.Vector;
    using Mip8RingBuffer for Mip8RingBuffer.Buffer;

    bytes32 private constant BITMAP_NAMESPACE = keccak256("mipland.example.bitmap");
    bytes32 private constant VECTOR_NAMESPACE = keccak256("mipland.example.vector");
    bytes32 private constant BUFFER_NAMESPACE = keccak256("mipland.example.buffer");

    function bitmapGet(uint256 index) external view returns (bool) {
        return Mip8DenseBitmap.layout(BITMAP_NAMESPACE).get(index);
    }

    function bitmapSet(uint256 index) external returns (bool) {
        return Mip8DenseBitmap.layout(BITMAP_NAMESPACE).set(index);
    }

    function bitmapUnset(uint256 index) external returns (bool) {
        return Mip8DenseBitmap.layout(BITMAP_NAMESPACE).unset(index);
    }

    function bitmapBase() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(BITMAP_NAMESPACE);
    }

    function bitmapWordSlot(uint256 index) external view returns (bytes32) {
        return Mip8DenseBitmap.layout(BITMAP_NAMESPACE).wordSlot(index);
    }

    function vectorLength() external view returns (uint256) {
        return Mip8Uint256Vector.layout(VECTOR_NAMESPACE).length;
    }

    function vectorGet(uint256 index) external view returns (uint256) {
        return Mip8Uint256Vector.layout(VECTOR_NAMESPACE).get(index);
    }

    function vectorSet(uint256 index, uint256 value) external {
        Mip8Uint256Vector.layout(VECTOR_NAMESPACE).set(index, value);
    }

    function vectorPush(uint256 value) external {
        Mip8Uint256Vector.layout(VECTOR_NAMESPACE).push(value);
    }

    function vectorPushMany(uint256[] calldata values) external {
        Mip8Uint256Vector.layout(VECTOR_NAMESPACE).pushMany(values);
    }

    function vectorPop() external returns (uint256) {
        return Mip8Uint256Vector.layout(VECTOR_NAMESPACE).pop();
    }

    function vectorReadRange(uint256 start, uint256 count)
        external
        view
        returns (uint256[] memory)
    {
        return Mip8Uint256Vector.layout(VECTOR_NAMESPACE).readRange(start, count);
    }

    function vectorBase() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(VECTOR_NAMESPACE);
    }

    function vectorElementSlot(uint256 index) external view returns (bytes32) {
        return Mip8Uint256Vector.layout(VECTOR_NAMESPACE).elementSlot(index);
    }

    function bufferPush(uint256 value) external {
        Mip8RingBuffer.layout(BUFFER_NAMESPACE).push(value);
    }

    function bufferPop() external returns (uint256) {
        return Mip8RingBuffer.layout(BUFFER_NAMESPACE).pop();
    }

    function bufferPeek() external view returns (uint256) {
        return Mip8RingBuffer.layout(BUFFER_NAMESPACE).peek();
    }

    function bufferAt(uint256 index) external view returns (uint256) {
        return Mip8RingBuffer.layout(BUFFER_NAMESPACE).at(index);
    }

    function bufferLength() external view returns (uint256) {
        return Mip8RingBuffer.layout(BUFFER_NAMESPACE).length;
    }

    function bufferHead() external view returns (uint256) {
        return Mip8RingBuffer.layout(BUFFER_NAMESPACE).head;
    }

    function bufferClear() external {
        Mip8RingBuffer.layout(BUFFER_NAMESPACE).clear();
    }

    function bufferBase() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(BUFFER_NAMESPACE);
    }
}

contract Mip8CollectionsTest is Test {
    Mip8CollectionsHarness private harness;

    function setUp() public {
        harness = new Mip8CollectionsHarness();
    }

    function test_namespacesArePageAlignedAndDistinct() public view {
        bytes32 bitmapBase = harness.bitmapBase();
        bytes32 vectorBase = harness.vectorBase();
        bytes32 bufferBase = harness.bufferBase();

        assertEq(uint256(bitmapBase) & 0x7f, 0);
        assertEq(uint256(vectorBase) & 0x7f, 0);
        assertEq(uint256(bufferBase) & 0x7f, 0);
        assertNotEq(bitmapBase, vectorBase);
        assertNotEq(bitmapBase, bufferBase);
        assertNotEq(vectorBase, bufferBase);
    }

    function test_bitmapSetGetAndUnset() public {
        assertFalse(harness.bitmapGet(7));
        assertTrue(harness.bitmapSet(7));
        assertTrue(harness.bitmapGet(7));
        assertFalse(harness.bitmapSet(7));
        assertTrue(harness.bitmapUnset(7));
        assertFalse(harness.bitmapGet(7));
        assertFalse(harness.bitmapUnset(7));
    }

    function test_bitmapWordsFollowMip8PageBoundaries() public view {
        bytes32 base = harness.bitmapBase();
        bytes32 lastSlotInFirstPage = harness.bitmapWordSlot(32_767);
        bytes32 firstSlotInSecondPage = harness.bitmapWordSlot(32_768);

        assertEq(lastSlotInFirstPage, bytes32(uint256(base) + 127));
        assertEq(firstSlotInSecondPage, bytes32(uint256(base) + 128));
        assertEq(uint256(lastSlotInFirstPage) >> 7, uint256(base) >> 7);
        assertEq(uint256(firstSlotInSecondPage) >> 7, (uint256(base) >> 7) + 1);
    }

    function test_vectorPushSetPopAndBounds() public {
        harness.vectorPush(10);
        harness.vectorPush(20);
        assertEq(harness.vectorLength(), 2);
        assertEq(harness.vectorGet(0), 10);
        assertEq(harness.vectorGet(1), 20);

        harness.vectorSet(1, 99);
        assertEq(harness.vectorGet(1), 99);
        assertEq(harness.vectorPop(), 99);
        assertEq(harness.vectorLength(), 1);

        vm.expectRevert(abi.encodeWithSelector(Mip8Uint256Vector.IndexOutOfBounds.selector, 1, 1));
        harness.vectorGet(1);
    }

    function test_vectorBatchRoundTripAcrossPageBoundary() public {
        uint256[] memory input = new uint256[](140);
        for (uint256 i; i < input.length; ++i) {
            input[i] = 1000 + i;
        }

        harness.vectorPushMany(input);
        uint256[] memory result = harness.vectorReadRange(120, 20);

        assertEq(harness.vectorLength(), 140);
        assertEq(result.length, 20);
        for (uint256 i; i < result.length; ++i) {
            assertEq(result[i], 1120 + i);
        }
    }

    function test_vectorSlotsReserveMetadataThenFillPages() public view {
        bytes32 base = harness.vectorBase();
        assertEq(harness.vectorElementSlot(0), bytes32(uint256(base) + 1));
        assertEq(harness.vectorElementSlot(126), bytes32(uint256(base) + 127));
        assertEq(harness.vectorElementSlot(127), bytes32(uint256(base) + 128));
    }

    function test_ringBufferWrapsAndPreservesFifoOrder() public {
        for (uint256 i; i < 126; ++i) {
            harness.bufferPush(i + 1);
        }

        vm.expectRevert(Mip8RingBuffer.BufferFull.selector);
        harness.bufferPush(127);

        for (uint256 i; i < 80; ++i) {
            assertEq(harness.bufferPop(), i + 1);
        }
        for (uint256 i; i < 80; ++i) {
            harness.bufferPush(127 + i);
        }

        assertEq(harness.bufferLength(), 126);
        assertEq(harness.bufferPeek(), 81);
        for (uint256 i; i < 126; ++i) {
            assertEq(harness.bufferAt(i), 81 + i);
        }
    }

    function test_ringBufferClearResetsAndDeletesValues() public {
        harness.bufferPush(41);
        harness.bufferPush(42);
        harness.bufferPop();
        harness.bufferPush(43);
        harness.bufferClear();

        assertEq(harness.bufferLength(), 0);
        assertEq(harness.bufferHead(), 0);
        vm.expectRevert(Mip8RingBuffer.BufferEmpty.selector);
        harness.bufferPeek();

        harness.bufferPush(99);
        assertEq(harness.bufferPeek(), 99);
    }
}
