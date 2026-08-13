// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Mip8Pages
/// @notice Storage-slot helpers for MIP-8's 128-word pages.
/// @dev Namespaces are re-hashed before alignment so callers can use readable,
///      application-specific constants such as keccak256("my.app.orders").
library Mip8Pages {
    uint256 internal constant WORDS_PER_PAGE = 128;
    uint256 internal constant PAGE_OFFSET_MASK = WORDS_PER_PAGE - 1;

    /// @notice Derive a 128-slot-aligned storage location from a namespace.
    /// @dev This follows the spirit of ERC-7201 namespaced storage, but aligns
    ///      to MIP-8's 128-word boundary rather than ERC-7201's 256-word boundary.
    function alignedSlot(bytes32 namespace) internal pure returns (bytes32 slot) {
        uint256 seed;
        unchecked {
            seed = uint256(namespace) - 1;
        }
        slot = bytes32(uint256(keccak256(abi.encode(seed))) & ~PAGE_OFFSET_MASK);
    }

    function pageIndex(bytes32 slot) internal pure returns (uint256) {
        return uint256(slot) >> 7;
    }

    function offset(bytes32 slot) internal pure returns (uint256) {
        return uint256(slot) & PAGE_OFFSET_MASK;
    }

    function isAligned(bytes32 slot) internal pure returns (bool) {
        return offset(slot) == 0;
    }
}
