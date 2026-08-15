// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

/**
 * @title FlatBitmap
 * @notice One level. No root, no leaves -- just 65,536 words covering uint24, addressed
 *         arithmetically. Built to test whether the root earns its place.
 *
 * @dev `slot = BASE + (id >> 8)`, `bit = id & 255`. That is the whole structure.
 *
 *      What it buys: add and remove are unconditionally ONE read and ONE write. No
 *      propagation, no root bit, and -- the big one -- no leaf-empty scan on remove, which is
 *      PageBitTree's worst row.
 *
 *      What it costs: nothing summarises occupancy, so a search that misses its own word has
 *      to walk. Within a page that is ~201 a word; every 128 words it crosses a page boundary
 *      and pays 8100. And there is no cheap answer to "is anything set at all", so `exists`
 *      and the not-found path have to scan the whole domain.
 */
library FlatBitmap {
    uint256 internal constant SLOTS_PER_PAGE = 128;
    uint256 internal constant WORDS = 65_536; // 2^24 / 256

    uint32 internal constant MAX_ID = 16_777_215;

    /// @dev == keccak256("flat-bitmap.words") & ~(SLOTS_PER_PAGE - 1)
    uint256 internal constant BASE =
        0x05800aad2db43d130be6d3ef84a20eb92850ce44d43ad8159a046e36b578d000;

    uint256 private constant NOT_FOUND = type(uint256).max;

    error IdOutOfRange(uint32 id);

    function contains(uint32 id) internal view returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            return _sload(BASE + (uint256(id) >> 8)) & (uint256(1) << (id & 0xff)) != 0;
        }
    }

    /// @notice One read, one write. Always.
    function add(uint32 id) internal returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            uint256 slot = BASE + (uint256(id) >> 8);
            uint256 word = _sload(slot);
            uint256 next = word | (uint256(1) << (id & 0xff));
            if (word == next) return false;
            _sstore(slot, next);
            return true;
        }
    }

    /// @notice One read, one write. Always. Nothing to propagate, nothing to scan.
    function remove(uint32 id) internal returns (bool) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            uint256 slot = BASE + (uint256(id) >> 8);
            uint256 word = _sload(slot);
            uint256 next = word & ~(uint256(1) << (id & 0xff));
            if (word == next) return false;
            _sstore(slot, next);
            return true;
        }
    }

    /// @notice Greatest id strictly below `id`, or 0. Walks words downward.
    function findFirstRight(uint32 id) internal view returns (uint32) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            uint256 w = uint256(id) >> 8;

            uint256 m = _sload(BASE + w) & ((uint256(1) << (id & 0xff)) - 1);
            if (m != 0) return uint32((w << 8) + _msb(m));

            while (w != 0) {
                --w;
                uint256 word = _sload(BASE + w);
                if (word != 0) return uint32((w << 8) + _msb(word));
            }
            return 0;
        }
    }

    /// @notice Least id strictly above `id`, or MAX_ID. Walks words upward.
    function findFirstLeft(uint32 id) internal view returns (uint32) {
        unchecked {
            if (id > MAX_ID) revert IdOutOfRange(id);
            uint256 w = uint256(id) >> 8;

            uint256 m = _sload(BASE + w) & (type(uint256).max << ((id & 0xff) + 1));
            if (m != 0) return uint32((w << 8) + _lsb(m));

            for (uint256 i = w + 1; i < WORDS; ++i) {
                uint256 word = _sload(BASE + i);
                if (word != 0) return uint32((i << 8) + _lsb(word));
            }
            return MAX_ID;
        }
    }

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
