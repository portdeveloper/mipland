// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

import { Test } from "forge-std/Test.sol";
import { PageBitTree } from "../src/mip8/page-bit-tree/PageBitTree.sol";
import { FlatBitmap } from "../src/mip8/page-bit-tree/FlatBitmap.sol";
import { HostPageBitTree, HostFlatBitmap } from "../src/mip8/page-bit-tree/Harness.sol";

/**
 * @notice Correctness for both page-aware bitmaps. Runs on vanilla revm -- behaviour and
 *         storage layout do not depend on the MIP-8 gas schedule. Only the gas suite does.
 *
 * @dev The two structures are independent implementations of the same abstract set, so they
 *      are each other's differential oracle: any input on which they disagree is a bug in one
 *      of them. A brute-force oracle pins both to ground truth.
 */
contract PageBitTreeTest is Test {
    HostPageBitTree internal tree;
    HostFlatBitmap internal flat;

    uint24 internal constant ACTIVE = 8_420_000;

    function setUp() public {
        tree = new HostPageBitTree();
        flat = new HostFlatBitmap();
        tree.init(ACTIVE);
        flat.init(ACTIVE);
    }

    /*//////////////////////////////////////////////////////////////
                       GEOMETRY: THE LITERALS HOLD
    //////////////////////////////////////////////////////////////*/

    /// @dev Every constant in the library is a literal, because `constant` inlines the
    ///      EXPRESSION and solc does not always fold it -- writing them as derivations cost 81
    ///      gas per operation, measured. The derivations are asserted here instead.
    function test_geometryIsExact() public pure {
        assertEq(PageBitTree.WORDS_PER_LEAF, PageBitTree.SLOTS_PER_PAGE, "leaf != one page");
        assertEq(PageBitTree.BITS_PER_LEAF, PageBitTree.WORDS_PER_LEAF * 256, "bits per leaf");
        assertEq(PageBitTree.BITS_PER_LEAF, 1 << PageBitTree.LEAF_SHIFT, "leaf shift");
        assertEq(PageBitTree.LEAF_MASK, PageBitTree.BITS_PER_LEAF - 1, "leaf mask");
        assertEq(PageBitTree.LEAVES, PageBitTree.ROOT_WORDS * 256, "leaves");

        // 9 bits of leaf + 7 of word + 8 of bit = 24, with nothing left over.
        assertEq(uint256(PageBitTree.MAX_ID), PageBitTree.LEAVES * PageBitTree.BITS_PER_LEAF - 1);
        assertEq(uint256(PageBitTree.MAX_ID), type(uint24).max, "domain is not exactly uint24");
        assertEq(uint256(FlatBitmap.MAX_ID), type(uint24).max, "domains differ");
        assertEq(FlatBitmap.WORDS * 256, uint256(type(uint24).max) + 1, "flat coverage");
    }

    /// @dev Both bases must be page-aligned, or the structure straddles a page boundary it did
    ///      not pay for and every claim about locality is off by one page.
    function test_basesArePageAligned() public pure {
        assertEq(PageBitTree.LEAF_BASE % PageBitTree.SLOTS_PER_PAGE, 0, "leaf base misaligned");
        assertEq(FlatBitmap.BASE % FlatBitmap.SLOTS_PER_PAGE, 0, "flat base misaligned");
        assertEq(
            PageBitTree.LEAF_BASE,
            uint256(keccak256("page-bit-tree.leaves")) & ~(PageBitTree.SLOTS_PER_PAGE - 1),
            "leaf base is not its stated derivation"
        );
        assertEq(
            FlatBitmap.BASE,
            uint256(keccak256("flat-bitmap.words")) & ~(FlatBitmap.SLOTS_PER_PAGE - 1),
            "flat base is not its stated derivation"
        );
    }

    /// @dev The whole co-location premise: the root must land on page 0, beside the header.
    function test_rootSharesPageZeroWithHeader() public view {
        uint256 s = tree.rootSlot();
        assertEq(s, 7, "root moved off its expected slot");
        assertEq(s / PageBitTree.SLOTS_PER_PAGE, 0, "root is not on page 0");
        assertLt(s + PageBitTree.ROOT_WORDS, PageBitTree.SLOTS_PER_PAGE, "root spills off page 0");
    }

    /// @dev Leaves must not collide with the application, with each other, or with the flat
    ///      bitmap's namespace.
    function test_namespacesDoNotCollide() public pure {
        assertGt(PageBitTree.LEAF_BASE, 65_535 + 10, "leaves overlap the history array");
        uint256 treeSpan = PageBitTree.LEAVES * PageBitTree.SLOTS_PER_PAGE;
        uint256 flatSpan = FlatBitmap.WORDS;
        assertTrue(
            PageBitTree.LEAF_BASE + treeSpan < FlatBitmap.BASE
                || FlatBitmap.BASE + flatSpan < PageBitTree.LEAF_BASE,
            "the two namespaces overlap"
        );
    }

    /*//////////////////////////////////////////////////////////////
                              BEHAVIOUR
    //////////////////////////////////////////////////////////////*/

    function test_addRemoveContains() public {
        assertFalse(tree.contains(ACTIVE));
        assertTrue(tree.add(ACTIVE));
        assertTrue(tree.contains(ACTIVE));
        assertFalse(tree.add(ACTIVE), "second add must report no change");
        assertTrue(tree.remove(ACTIVE));
        assertFalse(tree.contains(ACTIVE));
        assertFalse(tree.remove(ACTIVE), "second remove must report no change");
    }

    /// @dev Boundaries are where bit-decomposition breaks: leaf edges, word edges, domain
    ///      edges, and the exact power of two the domain is centred on.
    function test_boundarySweep() public {
        uint24[12] memory ids = [
            uint24(0),
            1,
            255,
            256,
            32_767,
            32_768,
            32_769,
            8_388_607,
            8_388_608,
            16_777_213,
            16_777_214,
            type(uint24).max
        ];
        for (uint256 i; i < ids.length; ++i) {
            assertTrue(tree.add(ids[i]), "add");
            assertTrue(tree.contains(ids[i]), "contains");
            assertTrue(flat.add(ids[i]), "flat add");
            assertTrue(flat.contains(ids[i]), "flat contains");
        }
        for (uint256 i; i < ids.length; ++i) {
            assertEq(tree.findRight(ids[i]), flat.findRight(ids[i]), "findRight disagreement");
            assertEq(tree.findLeft(ids[i]), flat.findLeft(ids[i]), "findLeft disagreement");
        }
    }

    /// @dev Routed through `this.` so the revert happens below the cheatcode's call depth --
    ///      an internal library call is inlined and `expectRevert` cannot see it.
    function probeTree(uint32 id) external view returns (bool) {
        return PageBitTree.contains(PageBitTree.LEAF_BASE, id);
    }

    function probeFlat(uint32 id) external view returns (bool) {
        return FlatBitmap.contains(id);
    }

    function test_outOfRangeReverts() public {
        uint32 bad = uint32(type(uint24).max) + 1;
        vm.expectRevert(abi.encodeWithSelector(PageBitTree.IdOutOfRange.selector, bad));
        this.probeTree(bad);
        vm.expectRevert(abi.encodeWithSelector(FlatBitmap.IdOutOfRange.selector, bad));
        this.probeFlat(bad);
    }

    /**
     * @dev The root's ONLY invariant: bit q is set exactly when leaf q holds at least one id.
     *      If it can be left set over an empty leaf, searches return ids that are not there;
     *      if it can be left clear over a non-empty leaf, searches skip live ids silently.
     *      Both failures are invisible until a specific removal order triggers them, so this
     *      walks a removal order designed to empty a leaf from the middle outward.
     */
    function test_rootBitTracksLeafEmptinessExactly() public {
        uint24 leafStart = 256 * 32_768;
        uint24[5] memory ids =
            [leafStart + 300, leafStart + 1, leafStart + 32_000, leafStart, leafStart + 5000];

        for (uint256 i; i < ids.length; ++i) {
            tree.add(ids[i]);
            assertTrue(tree.exists(), "root must report non-empty");
        }
        // Remove all but one, in an order that empties words out of sequence.
        for (uint256 i; i < ids.length - 1; ++i) {
            tree.remove(ids[i]);
            assertTrue(tree.exists(), "root cleared while an id remains");
        }
        tree.remove(ids[ids.length - 1]);
        assertFalse(tree.exists(), "root still set over an empty tree");
    }

    /*//////////////////////////////////////////////////////////////
                        DIFFERENTIAL + ORACLE
    //////////////////////////////////////////////////////////////*/

    /// @dev The two structures must be indistinguishable through the public interface.
    function testFuzz_treeAgreesWithFlat(uint24[16] calldata ids, uint24 probe) public {
        for (uint256 i; i < ids.length; ++i) {
            assertEq(tree.add(ids[i]), flat.add(ids[i]), "add disagreement");
        }
        for (uint256 i; i < ids.length; ++i) {
            assertEq(tree.contains(ids[i]), flat.contains(ids[i]), "contains disagreement");
        }
        assertEq(tree.findRight(probe), flat.findRight(probe), "findRight disagreement");
        assertEq(tree.findLeft(probe), flat.findLeft(probe), "findLeft disagreement");

        for (uint256 i; i < ids.length; ++i) {
            assertEq(tree.remove(ids[i]), flat.remove(ids[i]), "remove disagreement");
        }
        assertFalse(tree.exists(), "tree not empty after removing everything it was given");
    }

    /// @dev Agreement is not correctness -- two implementations can share a bug. This pins
    ///      both to a linear scan over a small window.
    function testFuzz_matchesBruteForceOracle(uint16 offset, uint8 mask) public {
        uint24 base = 4_000_000 + uint24(offset);
        uint24[] memory present = new uint24[](8);
        uint256 n;
        for (uint256 i; i < 8; ++i) {
            if (mask & (1 << i) != 0) {
                uint24 id = base + uint24(i * 137);
                tree.add(id);
                flat.add(id);
                present[n++] = id;
            }
        }

        uint24 probe = base + 600;

        uint24 expectedRight;
        for (uint256 i; i < n; ++i) {
            if (present[i] < probe && present[i] > expectedRight) expectedRight = present[i];
        }
        assertEq(tree.findRight(probe), expectedRight, "tree vs oracle, right");
        assertEq(flat.findRight(probe), expectedRight, "flat vs oracle, right");

        uint24 expectedLeft = type(uint24).max;
        for (uint256 i; i < n; ++i) {
            if (present[i] > probe && present[i] < expectedLeft) expectedLeft = present[i];
        }
        assertEq(tree.findLeft(probe), expectedLeft, "tree vs oracle, left");
        assertEq(flat.findLeft(probe), expectedLeft, "flat vs oracle, left");
    }

    /// @dev `CLZ` is an Osaka opcode. Under a pre-Osaka `evm_version` solc emits it anyway and
    ///      it reverts at runtime, so a wrong config must fail loudly here rather than quietly
    ///      in a benchmark.
    function test_clzIsAvailable() public pure {
        uint256 r;
        assembly ("memory-safe") {
            r := clz(1)
        }
        assertEq(r, 255, "CLZ unavailable or miscompiled -- evm_version must be osaka");
    }
}
