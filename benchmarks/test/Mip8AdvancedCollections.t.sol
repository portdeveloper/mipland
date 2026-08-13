// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Test } from "forge-std/Test.sol";
import { Mip8Pages } from "../src/mip8/Mip8Pages.sol";
import { Mip8KeyedPage } from "../src/mip8/Mip8KeyedPage.sol";
import { Mip8Slab } from "../src/mip8/Mip8Slab.sol";
import { Mip8Uint64Vector } from "../src/mip8/Mip8Uint64Vector.sol";
import { Mip8SmallBlob } from "../src/mip8/Mip8SmallBlob.sol";

contract Mip8AdvancedCollectionsHarness {
    using Mip8KeyedPage for Mip8KeyedPage.Page;
    using Mip8Slab for Mip8Slab.Slab;
    using Mip8Uint64Vector for Mip8Uint64Vector.Vector;
    using Mip8SmallBlob for Mip8SmallBlob.Blob;

    bytes32 private constant KEYED_NAMESPACE = keccak256("mipland.example.keyed-page");
    bytes32 private constant SLAB_NAMESPACE = keccak256("mipland.example.slab");
    bytes32 private constant U64_NAMESPACE = keccak256("mipland.example.uint64-vector");
    bytes32 private constant BLOB_NAMESPACE = keccak256("mipland.example.small-blob");

    function keyedGet(bytes32 key, uint256 index) external view returns (uint256) {
        return Mip8KeyedPage.layout(KEYED_NAMESPACE, key).get(index);
    }

    function keyedSet(bytes32 key, uint256 index, uint256 value) external {
        Mip8KeyedPage.layout(KEYED_NAMESPACE, key).set(index, value);
    }

    function keyedReadRange(bytes32 key, uint256 start, uint256 count)
        external
        view
        returns (uint256[] memory)
    {
        return Mip8KeyedPage.layout(KEYED_NAMESPACE, key).readRange(start, count);
    }

    function keyedBase(bytes32 key) external pure returns (bytes32) {
        return Mip8KeyedPage.baseSlot(KEYED_NAMESPACE, key);
    }

    function keyedValueSlot(bytes32 key, uint256 index) external view returns (bytes32) {
        return Mip8KeyedPage.layout(KEYED_NAMESPACE, key).valueSlot(index);
    }

    function slabInsert(uint256 value) external returns (uint256) {
        return Mip8Slab.layout(SLAB_NAMESPACE).insert(value);
    }

    function slabRemove(uint256 index) external returns (uint256) {
        return Mip8Slab.layout(SLAB_NAMESPACE).remove(index);
    }

    function slabGet(uint256 index) external view returns (uint256) {
        return Mip8Slab.layout(SLAB_NAMESPACE).get(index);
    }

    function slabSet(uint256 index, uint256 value) external {
        Mip8Slab.layout(SLAB_NAMESPACE).set(index, value);
    }

    function slabContains(uint256 index) external view returns (bool) {
        return Mip8Slab.layout(SLAB_NAMESPACE).contains(index);
    }

    function slabLength() external view returns (uint256) {
        return Mip8Slab.layout(SLAB_NAMESPACE).length;
    }

    function slabBase() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(SLAB_NAMESPACE);
    }

    function slabValueSlot(uint256 index) external view returns (bytes32) {
        return Mip8Slab.layout(SLAB_NAMESPACE).valueSlot(index);
    }

    function u64Push(uint64 value) external {
        Mip8Uint64Vector.layout(U64_NAMESPACE).push(value);
    }

    function u64PushMany(uint64[] calldata values) external {
        Mip8Uint64Vector.layout(U64_NAMESPACE).pushMany(values);
    }

    function u64Get(uint256 index) external view returns (uint64) {
        return Mip8Uint64Vector.layout(U64_NAMESPACE).get(index);
    }

    function u64Set(uint256 index, uint64 value) external {
        Mip8Uint64Vector.layout(U64_NAMESPACE).set(index, value);
    }

    function u64Pop() external returns (uint64) {
        return Mip8Uint64Vector.layout(U64_NAMESPACE).pop();
    }

    function u64ReadRange(uint256 start, uint256 count) external view returns (uint64[] memory) {
        return Mip8Uint64Vector.layout(U64_NAMESPACE).readRange(start, count);
    }

    function u64Length() external view returns (uint256) {
        return Mip8Uint64Vector.layout(U64_NAMESPACE).length;
    }

    function u64Base() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(U64_NAMESPACE);
    }

    function u64WordSlot(uint256 index) external view returns (bytes32) {
        return Mip8Uint64Vector.layout(U64_NAMESPACE).wordSlot(index);
    }

    function blobWrite(bytes calldata data) external {
        Mip8SmallBlob.layout(BLOB_NAMESPACE).write(data);
    }

    function blobRead() external view returns (bytes memory) {
        return Mip8SmallBlob.layout(BLOB_NAMESPACE).read();
    }

    function blobClear() external {
        Mip8SmallBlob.layout(BLOB_NAMESPACE).clear();
    }

    function blobLength() external view returns (uint256) {
        return Mip8SmallBlob.layout(BLOB_NAMESPACE).length;
    }

    function blobBase() external pure returns (bytes32) {
        return Mip8Pages.alignedSlot(BLOB_NAMESPACE);
    }

    function blobDataWordSlot(uint256 index) external view returns (bytes32) {
        return Mip8SmallBlob.layout(BLOB_NAMESPACE).dataWordSlot(index);
    }
}

contract Mip8AdvancedCollectionsTest is Test {
    Mip8AdvancedCollectionsHarness private harness;

    function setUp() public {
        harness = new Mip8AdvancedCollectionsHarness();
    }

    function test_keyedPagesAreAlignedDistinctAndIsolated() public {
        bytes32 alice = keccak256("alice");
        bytes32 bob = keccak256("bob");
        bytes32 aliceBase = harness.keyedBase(alice);
        bytes32 bobBase = harness.keyedBase(bob);

        assertEq(uint256(aliceBase) & 0x7f, 0);
        assertEq(uint256(bobBase) & 0x7f, 0);
        assertNotEq(aliceBase, bobBase);

        harness.keyedSet(alice, 0, 11);
        harness.keyedSet(alice, 127, 99);
        harness.keyedSet(bob, 0, 22);
        assertEq(harness.keyedGet(alice, 0), 11);
        assertEq(harness.keyedGet(alice, 127), 99);
        assertEq(harness.keyedGet(bob, 0), 22);
        assertEq(harness.keyedGet(bob, 127), 0);

        assertEq(harness.keyedValueSlot(alice, 0), aliceBase);
        assertEq(harness.keyedValueSlot(alice, 127), bytes32(uint256(aliceBase) + 127));
        assertEq(uint256(harness.keyedValueSlot(alice, 127)) >> 7, uint256(aliceBase) >> 7);
    }

    function test_keyedPageRangeAndBounds() public {
        bytes32 key = keccak256("market-1");
        for (uint256 i; i < 8; ++i) {
            harness.keyedSet(key, 40 + i, 1000 + i);
        }
        uint256[] memory values = harness.keyedReadRange(key, 40, 8);
        for (uint256 i; i < values.length; ++i) {
            assertEq(values[i], 1000 + i);
        }

        vm.expectRevert(abi.encodeWithSelector(Mip8KeyedPage.IndexOutOfBounds.selector, 128));
        harness.keyedSet(key, 128, 1);
        vm.expectRevert(abi.encodeWithSelector(Mip8KeyedPage.RangeOutOfBounds.selector, 127, 2));
        harness.keyedReadRange(key, 127, 2);
    }

    function test_slabAllocatesRemovesAndReusesIndices() public {
        assertEq(harness.slabInsert(0), 0);
        assertTrue(harness.slabContains(0));
        assertEq(harness.slabGet(0), 0);

        for (uint256 i = 1; i < 126; ++i) {
            assertEq(harness.slabInsert(10_000 + i), i);
        }
        assertEq(harness.slabLength(), 126);
        vm.expectRevert(Mip8Slab.SlabFull.selector);
        harness.slabInsert(999);

        assertEq(harness.slabRemove(40), 10_040);
        assertFalse(harness.slabContains(40));
        assertEq(harness.slabLength(), 125);
        assertEq(harness.slabInsert(77_777), 40);
        assertEq(harness.slabGet(40), 77_777);

        harness.slabSet(40, 88_888);
        assertEq(harness.slabGet(40), 88_888);
    }

    function test_slabFitsExactlyOnePage() public view {
        bytes32 base = harness.slabBase();
        assertEq(harness.slabValueSlot(0), bytes32(uint256(base) + 2));
        assertEq(harness.slabValueSlot(125), bytes32(uint256(base) + 127));
        assertEq(uint256(harness.slabValueSlot(125)) >> 7, uint256(base) >> 7);
    }

    function test_uint64VectorPackingDoesNotCorruptNeighbors() public {
        harness.u64Push(1);
        harness.u64Push(2);
        harness.u64Push(3);
        harness.u64Push(type(uint64).max);

        bytes32 firstWordSlot = harness.u64WordSlot(0);
        uint256 packed = uint256(vm.load(address(harness), firstWordSlot));
        uint256 expected = uint256(1) | (uint256(2) << 64) | (uint256(3) << 128)
            | (uint256(type(uint64).max) << 192);
        assertEq(packed, expected);

        harness.u64Set(1, 42);
        assertEq(harness.u64Get(0), 1);
        assertEq(harness.u64Get(1), 42);
        assertEq(harness.u64Get(2), 3);
        assertEq(harness.u64Get(3), type(uint64).max);
        assertEq(harness.u64Pop(), type(uint64).max);
        assertEq(harness.u64Length(), 3);
    }

    function test_uint64VectorCrossesPageAfter508Values() public {
        uint64[] memory input = new uint64[](520);
        for (uint256 i; i < input.length; ++i) {
            input[i] = uint64(i * 13 + 7);
        }
        harness.u64PushMany(input);

        uint64[] memory values = harness.u64ReadRange(500, 20);
        for (uint256 i; i < values.length; ++i) {
            assertEq(values[i], uint64((500 + i) * 13 + 7));
        }

        bytes32 base = harness.u64Base();
        assertEq(harness.u64WordSlot(0), bytes32(uint256(base) + 1));
        assertEq(harness.u64WordSlot(507), bytes32(uint256(base) + 127));
        assertEq(harness.u64WordSlot(508), bytes32(uint256(base) + 128));
    }

    function testFuzz_uint64VectorRoundTrip(uint64 a, uint64 b, uint64 c, uint64 replacement)
        public
    {
        harness.u64Push(a);
        harness.u64Push(b);
        harness.u64Push(c);
        harness.u64Set(1, replacement);
        assertEq(harness.u64Get(0), a);
        assertEq(harness.u64Get(1), replacement);
        assertEq(harness.u64Get(2), c);
    }

    function test_blobRoundTripsBoundaryLengthsAndClearsTrailingWords() public {
        uint256[6] memory lengths = [uint256(0), 1, 31, 32, 33, 4064];
        for (uint256 i; i < lengths.length; ++i) {
            bytes memory input = _pattern(lengths[i], uint8(i + 1));
            harness.blobWrite(input);
            assertEq(harness.blobLength(), input.length);
            assertEq(keccak256(harness.blobRead()), keccak256(input));
        }

        harness.blobWrite(hex"aabbcc");
        assertEq(harness.blobRead(), hex"aabbcc");
        assertEq(vm.load(address(harness), harness.blobDataWordSlot(1)), bytes32(0));

        harness.blobClear();
        assertEq(harness.blobLength(), 0);
        assertEq(harness.blobRead().length, 0);
        assertEq(vm.load(address(harness), harness.blobDataWordSlot(0)), bytes32(0));
    }

    function test_blobRejectsOversizeAndFitsExactlyOnePage() public {
        bytes memory oversized = new bytes(4065);
        vm.expectRevert(abi.encodeWithSelector(Mip8SmallBlob.BlobTooLarge.selector, 4065));
        harness.blobWrite(oversized);

        bytes32 base = harness.blobBase();
        assertEq(harness.blobDataWordSlot(0), bytes32(uint256(base) + 1));
        assertEq(harness.blobDataWordSlot(126), bytes32(uint256(base) + 127));
        assertEq(uint256(harness.blobDataWordSlot(126)) >> 7, uint256(base) >> 7);
    }

    function testFuzz_blobRoundTrip(bytes calldata input) public {
        vm.assume(input.length <= 4064);
        harness.blobWrite(input);
        assertEq(keccak256(harness.blobRead()), keccak256(input));
    }

    function _pattern(uint256 length, uint8 seed) private pure returns (bytes memory data) {
        data = new bytes(length);
        for (uint256 i; i < length; ++i) {
            data[i] = bytes1(uint8(uint256(seed) + i));
        }
    }
}
