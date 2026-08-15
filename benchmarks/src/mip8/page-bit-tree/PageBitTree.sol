// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

/**
 * @title PageBitTree
 * @notice A two-level sparse-set bitmap over a uint24 id space, laid out for MIP-8 pages.
 *         Supports membership, insert, remove, and nearest-set-id search in both directions.
 *
 *         This is `Mip8DenseBitmap` scaled past one page, plus a root that summarises which
 *         pages are non-empty. `FlatBitmap` in this folder is the same structure WITHOUT the
 *         root; the pair exists to measure whether the root earns its place. Under MIP-8 it
 *         mostly does not -- see this folder's README.
 *
 * @dev Layout. The root is `ROOT_WORDS` slots, one existence bit per leaf. Each leaf is one
 *      whole 4 KB page of payload:
 *
 *          rootSlot + 0        leaves   0..255
 *          rootSlot + 1        leaves 256..511
 *          leafBase + 0..127   128 x 256 = 32,768 id bits = 2^15
 *
 *      512 leaves x 32,768 covers uint24 exactly, so the root is two words and an id IS its
 *      address -- no hashing, no division:
 *
 *          q = id >> 15            leaf
 *          w = (id & 32767) >> 8   word in leaf
 *          b = id & 255            bit in word
 *
 *      The root belongs in the host's own header page. A caller that reads the header has
 *      already paid that page's cold charge, so every root access costs 100 rather than 8100.
 *
 *      The root exists only to answer "which leaves are non-empty". Leaf ADDRESSES are
 *      arithmetic and need no lookup. Without it a cross-leaf search would have to probe
 *      leaves one at a time at 8100 each just to find them empty -- 1.6M gas to reach a leaf
 *      200 away. With it that is ~200 gas at any distance, because it is a bitmap, not a walk.
 *      It costs ~2,900 once per leaf created, and nothing on the common intra-leaf path.
 *
 * @dev Capacity comes from the root and nothing else. A slot is 256 bits and each bit marks
 *      one leaf, so a root slot addresses 256 leaves; a leaf holds 32,768 ids. Every root
 *      slot is therefore worth 256 x 32,768 = 2^23 ids:
 *
 *          ROOT_WORDS = 1  ->   8,388,608 ids
 *          ROOT_WORDS = 2  ->  16,777,216 ids   (uint24, the current setting)
 *
 *      `LEAVES` and `MAX_ID` derive from it, so it is the only constant to change.
 *
 * @dev Levels are scanned. A scanned word costs ~201 and a cold page 8100, so scanning ~40
 *      words is cheaper than touching one more page. This assumes ids CLUSTER. Cost therefore
 *      scales with the distance between set ids, not with the size of the domain.
 *
 * @dev SAFETY: the root scan must never index outside the root. `q < LEAVES` follows from
 *      `id <= MAX_ID`, so `q >> 8 < ROOT_WORDS`; both scans are bounded by `ROOT_WORDS` too.
 *      With the root on the host's page, an out-of-range index corrupts live host state
 *      rather than aliasing harmlessly inside the tree.
 *
 * @dev `findFirstRight` returns the greatest id STRICTLY LESS than the argument, or 0 if none;
 *      `findFirstLeft` the least STRICTLY GREATER, or type(uint24).max. This matches
 *      the convention used by tick-bitmap search: the caller asks "what is the next set id
 *      strictly past here", never "is here set" (that is `contains`).
 */
library PageBitTree {
    /*//////////////////////////////////////////////////////////////
        Every constant here is a LITERAL, not a derived expression.
        `constant` inlines the expression, and solc does not always fold
        it: writing these as `BITS_PER_LEAF - 1` and so on cost 81 gas
        per operation, measured. The derivations are asserted instead --
        see `test_geometryIsExact` and `test_leafBaseMatchesItsDerivation`.
    //////////////////////////////////////////////////////////////*/

    /// @dev A MIP-8 page. A leaf is exactly one: smaller wastes capacity already paid for,
    ///      larger costs a second cold charge on every access.
    uint256 internal constant SLOTS_PER_PAGE = 128;
    uint256 internal constant WORDS_PER_LEAF = 128; // == SLOTS_PER_PAGE
    uint256 internal constant BITS_PER_LEAF = 32_768; // == WORDS_PER_LEAF * 256 == 2^15
    uint256 internal constant LEAF_SHIFT = 15; // == log2(BITS_PER_LEAF)
    uint256 internal constant LEAF_MASK = 32_767; // == BITS_PER_LEAF - 1

    /**
     * @notice Capacity dial: one slot per 256 leaves, so one slot per 2^23 ids. 1 -> uint23,
     *         2 -> uint24 (current), 3 -> 25.1M, 128 -> 2^30 and the root fills a page.
     *         Bounded by the host's spare slots, and by 512 before `MAX_ID` overflows uint32.
     * @dev Past 2 the domain exceeds uint24, so callers must widen to uint32 and re-check the
     *      sentinels. Note the failure is SILENT at any power of two: `ROOT_WORDS * 2^23 - 1`
     *      truncates to exactly uint24 max.
     */
    uint256 internal constant ROOT_WORDS = 2;
    uint256 internal constant LEAVES = 512; // == ROOT_WORDS * 256

    /// @notice Largest representable id. At ROOT_WORDS = 2 this is exactly type(uint24).max.
    uint32 internal constant MAX_ID = 16_777_215; // == LEAVES * BITS_PER_LEAF - 1

    /// @dev Page-aligned leaf namespace, clear of host storage.
    ///      == keccak256("page-bit-tree.leaves") & ~(SLOTS_PER_PAGE - 1)
    uint256 internal constant LEAF_BASE =
        0x502717a7c08b6fa3beb56b3dee960456358d2b9d9a5fb51efdffda04a08ec080;

    uint256 private constant NOT_FOUND = type(uint256).max;

    error IdOutOfRange(uint32 id);

    /*//////////////////////////////////////////////////////////////
                                 READS
    //////////////////////////////////////////////////////////////*/

    /// @notice True if the tree holds any id. Reads the whole root; one page.
    function exists(uint256 rootSlot) internal view returns (bool) {
        unchecked {
            uint256 acc;
            for (uint256 i; i < ROOT_WORDS; ++i) {
                acc |= _sload(rootSlot + i);
            }
            return acc != 0;
        }
    }

    function contains(uint256 leafBase, uint32 id) internal view returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            uint256 q = uint256(id) >> LEAF_SHIFT;
            uint256 r = uint256(id) & LEAF_MASK;
            uint256 slot = _leaf(leafBase, q) + (r >> 8);
            return _sload(slot) & (uint256(1) << (r & 0xff)) != 0;
        }
    }

    /*//////////////////////////////////////////////////////////////
                                WRITES
    //////////////////////////////////////////////////////////////*/

    /// @notice Adds `id`, true if it was not already present.
    /// @dev Writes ONE slot, plus a root bit when a leaf first appears. Never three.
    function add(uint256 rootSlot, uint256 leafBase, uint32 id) internal returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);

            uint256 q = uint256(id) >> LEAF_SHIFT;
            uint256 r = uint256(id) & LEAF_MASK;
            uint256 w = r >> 8;

            uint256 base = _leaf(leafBase, q);
            uint256 slot = base + w;

            uint256 word = _sload(slot);
            uint256 newWord = word | (uint256(1) << (r & 0xff));
            if (word == newWord) return false;
            _sstore(slot, newWord);

            // Word became non-empty, so the leaf certainly is. Ensure the root says so.
            if (word == 0) {
                uint256 rSlot = rootSlot + (q >> 8);
                uint256 bit = uint256(1) << (q & 0xff);
                uint256 rWord = _sload(rSlot);
                if (rWord & bit == 0) _sstore(rSlot, rWord | bit);
            }
            return true;
        }
    }

    /// @notice Removes `id`, returning true if it was present.
    function remove(uint256 rootSlot, uint256 leafBase, uint32 id) internal returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);

            uint256 q = uint256(id) >> LEAF_SHIFT;
            uint256 r = uint256(id) & LEAF_MASK;
            uint256 w = r >> 8;

            uint256 base = _leaf(leafBase, q);
            uint256 slot = base + w;

            uint256 word = _sload(slot);
            uint256 newWord = word & ~(uint256(1) << (r & 0xff));
            if (word == newWord) return false;
            _sstore(slot, newWord);

            // Only an emptied word can have emptied the leaf, and with no index the only
            // way to know is to scan. Same page, so warm; exits at the first survivor.
            if (newWord == 0 && _leafIsEmpty(base, w)) {
                uint256 rSlot = rootSlot + (q >> 8);
                _sstore(rSlot, _sload(rSlot) & ~(uint256(1) << (q & 0xff)));
            }
            return true;
        }
    }

    /*//////////////////////////////////////////////////////////////
                                SEARCH
    //////////////////////////////////////////////////////////////*/

    /// @notice Greatest present id strictly less than `id`, or 0 if there is none.
    function findFirstRight(uint256 rootSlot, uint256 leafBase, uint32 id)
        internal
        view
        returns (uint32)
    {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);

            uint256 q = uint256(id) >> LEAF_SHIFT;
            uint256 r = uint256(id) & LEAF_MASK;
            uint256 w = r >> 8;
            uint256 base = _leaf(leafBase, q);

            // 1. Closer bit inside the word holding `id`.
            uint256 m = _maskBelow(_sload(base + w), r & 0xff);
            if (m != 0) return uint32((q << LEAF_SHIFT) + (w << 8) + _msb(m));

            // 2. Scan lower words of this leaf. Same page, so warm.
            if (w != 0) {
                (uint256 w2, uint256 word2) = _scanDown(base, w - 1);
                if (w2 != NOT_FOUND) return uint32((q << LEAF_SHIFT) + (w2 << 8) + _msb(word2));
            }

            // 3. Preceding non-empty leaf, through the root.
            uint256 q2 = _prevLeaf(rootSlot, q);
            if (q2 == NOT_FOUND) return 0;

            uint256 b2 = _leaf(leafBase, q2);
            (uint256 w3, uint256 word3) = _scanDown(b2, WORDS_PER_LEAF - 1);
            return uint32((q2 << LEAF_SHIFT) + (w3 << 8) + _msb(word3));
        }
    }

    /// @notice Least present id strictly greater than `id`, or type(uint24).max if none.
    function findFirstLeft(uint256 rootSlot, uint256 leafBase, uint32 id)
        internal
        view
        returns (uint32)
    {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);

            uint256 q = uint256(id) >> LEAF_SHIFT;
            uint256 r = uint256(id) & LEAF_MASK;
            uint256 w = r >> 8;
            uint256 base = _leaf(leafBase, q);

            uint256 m = _maskAbove(_sload(base + w), r & 0xff);
            if (m != 0) return _clamp((q << LEAF_SHIFT) + (w << 8) + _lsb(m));

            if (w != WORDS_PER_LEAF - 1) {
                (uint256 w2, uint256 word2) = _scanUp(base, w + 1);
                if (w2 != NOT_FOUND) return _clamp((q << LEAF_SHIFT) + (w2 << 8) + _lsb(word2));
            }

            uint256 q2 = _nextLeaf(rootSlot, q);
            if (q2 == NOT_FOUND) return MAX_ID;

            uint256 b2 = _leaf(leafBase, q2);
            (uint256 w3, uint256 word3) = _scanUp(b2, 0);
            return _clamp((q2 << LEAF_SHIFT) + (w3 << 8) + _lsb(word3));
        }
    }

    /*//////////////////////////////////////////////////////////////
                              LEAF SCANS
    //////////////////////////////////////////////////////////////*/

    /// @dev Highest non-empty word at or below `start`, with its value.
    function _scanDown(uint256 base, uint256 start) private view returns (uint256, uint256) {
        unchecked {
            for (uint256 i = start + 1; i != 0;) {
                --i;
                uint256 word = _sload(base + i);
                if (word != 0) return (i, word);
            }
            return (NOT_FOUND, 0);
        }
    }

    /// @dev Lowest non-empty word at or above `start`, with its value.
    function _scanUp(uint256 base, uint256 start) private view returns (uint256, uint256) {
        unchecked {
            for (uint256 i = start; i < WORDS_PER_LEAF; ++i) {
                uint256 word = _sload(base + i);
                if (word != 0) return (i, word);
            }
            return (NOT_FOUND, 0);
        }
    }

    /// @dev Is the leaf empty? `skip` was just zeroed, so it is not re-read. Walks OUTWARD
    ///      from `skip`: ids cluster, so a survivor is usually adjacent.
    function _leafIsEmpty(uint256 base, uint256 skip) private view returns (bool) {
        unchecked {
            for (uint256 d = 1; d < WORDS_PER_LEAF; ++d) {
                if (d <= skip && _sload(base + skip - d) != 0) return false;
                uint256 up = skip + d;
                if (up < WORDS_PER_LEAF && _sload(base + up) != 0) return false;
            }
            return true;
        }
    }

    /*//////////////////////////////////////////////////////////////
                          ROOT SCAN (BOUNDED)
    //////////////////////////////////////////////////////////////*/

    /// @dev Greatest non-empty leaf strictly below `q`, or NOT_FOUND. `rw` starts inside the
    ///      root and only decreases, so no access can leave it.
    function _prevLeaf(uint256 rootSlot, uint256 q) private view returns (uint256) {
        unchecked {
            uint256 rw = q >> 8;

            uint256 m = _maskBelow(_sload(rootSlot + rw), q & 0xff);
            if (m != 0) return (rw << 8) + _msb(m);

            while (rw != 0) {
                --rw;
                uint256 word = _sload(rootSlot + rw);
                if (word != 0) return (rw << 8) + _msb(word);
            }
            return NOT_FOUND;
        }
    }

    /// @dev Least non-empty leaf strictly above `q`, or NOT_FOUND. Bounded by ROOT_WORDS, so
    ///      it can never read past the root into whatever follows it.
    function _nextLeaf(uint256 rootSlot, uint256 q) private view returns (uint256) {
        unchecked {
            uint256 rw = q >> 8;

            uint256 m = _maskAbove(_sload(rootSlot + rw), q & 0xff);
            if (m != 0) return (rw << 8) + _lsb(m);

            for (uint256 i = rw + 1; i < ROOT_WORDS; ++i) {
                uint256 word = _sload(rootSlot + i);
                if (word != 0) return (i << 8) + _lsb(word);
            }
            return NOT_FOUND;
        }
    }

    /*//////////////////////////////////////////////////////////////
                            BIT PRIMITIVES
    //////////////////////////////////////////////////////////////*/

    /// @dev Clamp: a malformed leaf can never return an out-of-domain id.
    function _clamp(uint256 v) private pure returns (uint32) {
        return v > MAX_ID ? MAX_ID : uint32(v);
    }

    /// @dev Bits below `bit`. `bit == 0` yields 0 with no branch.
    function _maskBelow(uint256 x, uint256 bit) private pure returns (uint256 m) {
        assembly ("memory-safe") {
            m := and(x, sub(shl(bit, 1), 1))
        }
    }

    /// @dev Bits above `bit`. `bit == 255` yields 0 with no branch: EVM `shl` returns 0 for
    ///      shifts >= 256.
    function _maskAbove(uint256 x, uint256 bit) private pure returns (uint256 m) {
        assembly ("memory-safe") {
            m := and(x, shl(add(bit, 1), not(0)))
        }
    }

    /// @dev MIP-5 / EIP-7939 `CLZ`, 5 gas. Requires x != 0.
    function _msb(uint256 x) private pure returns (uint256 r) {
        assembly ("memory-safe") {
            r := sub(255, clz(x))
        }
    }

    function _lsb(uint256 x) private pure returns (uint256 r) {
        assembly ("memory-safe") {
            r := sub(255, clz(and(x, sub(0, x))))
        }
    }

    /*//////////////////////////////////////////////////////////////
                              RAW STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @dev First slot of leaf `q`.
    function _leaf(uint256 leafBase, uint256 q) private pure returns (uint256) {
        unchecked {
            return leafBase + SLOTS_PER_PAGE * q;
        }
    }

    function _sload(uint256 slot) private view returns (uint256 v) {
        assembly ("memory-safe") {
            v := sload(slot)
        }
    }

    function _sstore(uint256 slot, uint256 v) private {
        assembly ("memory-safe") {
            sstore(slot, v)
        }
    }
}
