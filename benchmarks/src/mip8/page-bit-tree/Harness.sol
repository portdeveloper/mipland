// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

import { PageBitTree } from "./PageBitTree.sol";
import { FlatBitmap } from "./FlatBitmap.sol";

/**
 * @title Page-aware bitmap harnesses
 * @notice Both structures embedded in a realistic application storage layout, so the page-0
 *         co-location effect is measured rather than assumed.
 *
 * @dev Why a harness at all. Calling a library directly measures the library in isolation,
 *      which is not how it is paid for. Under MIP-8 the cost of a structure depends on which
 *      pages the SURROUNDING contract has already warmed. A summary word co-located with a
 *      header the caller reads anyway costs 100; the same word on its own page costs 8100.
 *      That 81x swing is invisible unless the harness has a realistic layout.
 *
 * @dev The layout below was taken from a deployed contract via `forge inspect <C>
 *      storage-layout`. The shape is what matters and it is a common one: a small hot header
 *      low down, an index structure right after it, then a large array consuming the rest of
 *      the page.
 *
 *        slot 0      _positions      mapping(address => mapping(uint256 => uint256))
 *        slot 1      _supply         mapping(uint256 => uint256)
 *        slot 2      _approvals      mapping(address => mapping(address => bool))
 *        slot 3      _header         bytes32   <- read on every access
 *        slot 4      _reserves       bytes32   <- read on every access
 *        slot 5      _fees           bytes32
 *        slot 6      _entryData      mapping(uint256 => bytes32)
 *        slot 7..9   the root        3 slots
 *        slot 10..   _history        65,535 slots, swallowing the rest of page 0
 *
 *      Page 0 is slots 0..127, so `_header`, `_reserves` and the root share one page and any
 *      caller cold-charges it before touching the structure.
 *
 * @dev This layout is typical, NOT universal. If your contract has spare slots on its header
 *      page you have more freedom; if its index shares a page with nothing hot, the
 *      co-location result does not transfer. One `forge inspect` settles it.
 *
 * @dev Both harnesses declare the same variables in the same order, so both compile to the
 *      same layout and the comparison is like-for-like. The only difference is what occupies
 *      slots 7..9.
 */
abstract contract HostBase {
    mapping(address => mapping(uint256 => uint256)) internal _positions;
    mapping(uint256 => uint256) internal _supply;
    mapping(address => mapping(address => bool)) internal _approvals;
    bytes32 internal _header;
    bytes32 internal _reserves;
    bytes32 internal _fees;
    mapping(uint256 => bytes32) internal _entryData;

    error HostNotInitialised();

    /// @notice An empty external call. Subtracting this removes calldata, dispatch and the
    ///         `CALL` itself from every measurement.
    function noop() external returns (bool) {
        return true;
    }

    /**
     * @dev What every caller does before touching the structure: read the header. This
     *      cold-charges page 0, so any state living there is warm afterwards.
     *
     *      The result MUST be consumed observably. solc deletes an SLOAD whose value is
     *      unused, which silently removes the preamble and the entire effect being measured.
     *      A conditional revert cannot be optimised away, and a real application validates
     *      here anyway.
     */
    function _readHeader() internal view returns (uint256 activeId) {
        uint256 p = uint256(_header);
        uint256 r = uint256(_reserves);
        if (p == 0 || r == 0) revert HostNotInitialised();
        return p;
    }

    /// @dev The per-entry accounting a real write does alongside the structure update. Three
    ///      keccak-scattered mappings, so each id lands on its OWN page. This is what the
    ///      bitmap competes against for a share of the transaction.
    function _writeEntryData(uint24 id) internal {
        _entryData[id] = bytes32(uint256(1));
        _supply[id] = 1;
        _positions[msg.sender][id] = 1;
    }

    function init(uint24 activeId) external {
        _header = bytes32(uint256(activeId));
        _reserves = bytes32(uint256(1));
        _fees = bytes32(uint256(1));
    }

    /**
     * @notice Marginal cost of a SECOND cold-storage read on the SAME page, measured inside
     *         one call so no cross-call warming can distort it.
     *
     * @dev This is the one number that identifies the gas schedule. MIP-8 charges the page
     *      once and makes every later slot on it warm, so the second read is ~100. Without a
     *      page model each slot is independently cold, so it is ~2100. Call overhead, calldata
     *      and account access all cancel because they fall outside both windows.
     */
    function probeSchedule() external view returns (uint256 marginal) {
        uint256 base = uint256(keccak256("page-bit-tree.preflight")) & ~uint256(127);
        uint256 a;
        uint256 b;
        uint256 g0 = gasleft();
        assembly ("memory-safe") {
            a := sload(base)
        }
        uint256 g1 = gasleft();
        assembly ("memory-safe") {
            b := sload(add(base, 1))
        }
        uint256 g2 = gasleft();
        // Consume both, or solc deletes the loads and the probe measures nothing.
        if (a == 1 && b == 1) revert HostNotInitialised();
        return g1 - g2;
    }
}

/// @notice Two-level: a two-word root on the application's own header page, leaves in their
///         own pages.
contract HostPageBitTree is HostBase {
    /// @dev Three slots, of which two carry root bits. Sized to fit the gap a typical
    ///      application already has between its header and its bulk storage.
    uint256[3] internal _root;

    uint256 internal constant ROOT_SLOT = 7;
    uint256 internal constant LEAF_BASE = PageBitTree.LEAF_BASE;

    /// @dev Guards the premise: the root must actually land on page 0.
    function rootSlot() external pure returns (uint256 s) {
        assembly ("memory-safe") {
            s := _root.slot
        }
    }

    function add(uint24 id) external returns (bool) {
        return PageBitTree.add(ROOT_SLOT, LEAF_BASE, id);
    }

    function remove(uint24 id) external returns (bool) {
        return PageBitTree.remove(ROOT_SLOT, LEAF_BASE, id);
    }

    function contains(uint24 id) external view returns (bool) {
        return PageBitTree.contains(LEAF_BASE, id);
    }

    function exists() external view returns (bool) {
        return PageBitTree.exists(ROOT_SLOT);
    }

    function findRight(uint24 id) external view returns (uint24) {
        _readHeader();
        return uint24(PageBitTree.findFirstRight(ROOT_SLOT, LEAF_BASE, id));
    }

    function findLeft(uint24 id) external view returns (uint24) {
        _readHeader();
        return uint24(PageBitTree.findFirstLeft(ROOT_SLOT, LEAF_BASE, id));
    }

    /// @dev Crossing `steps` ids in ONE transaction: preamble paid once, pages stay warm.
    function walk(uint24 from, uint256 steps) external view returns (uint24 id) {
        _readHeader();
        id = from;
        for (uint256 i; i < steps; ++i) {
            uint24 next = uint24(PageBitTree.findFirstRight(ROOT_SLOT, LEAF_BASE, id));
            if (next == 0) break;
            id = next;
        }
    }

    /// @dev A realistic write: per-entry accounting AND the structure, over a range.
    function insertRange(uint24 lo, uint256 count) external {
        _readHeader();
        for (uint256 i; i < count; ++i) {
            uint24 id = lo + uint24(i);
            _writeEntryData(id);
            PageBitTree.add(ROOT_SLOT, LEAF_BASE, id);
        }
    }

    function insert(uint24 id) external returns (bool) {
        _readHeader();
        return PageBitTree.add(ROOT_SLOT, LEAF_BASE, id);
    }

    function erase(uint24 id) external returns (bool) {
        _readHeader();
        return PageBitTree.remove(ROOT_SLOT, LEAF_BASE, id);
    }
}

/// @notice One level: the same leaves, no root. Same declarations in the same order, so the
///         storage layout is identical and slots 7..9 simply go unused.
contract HostFlatBitmap is HostBase {
    uint256[3] internal _unused;

    function add(uint24 id) external returns (bool) {
        return FlatBitmap.add(id);
    }

    function remove(uint24 id) external returns (bool) {
        return FlatBitmap.remove(id);
    }

    function contains(uint24 id) external view returns (bool) {
        return FlatBitmap.contains(id);
    }

    function findRight(uint24 id) external view returns (uint24) {
        _readHeader();
        return uint24(FlatBitmap.findFirstRight(id));
    }

    function findLeft(uint24 id) external view returns (uint24) {
        _readHeader();
        return uint24(FlatBitmap.findFirstLeft(id));
    }

    function walk(uint24 from, uint256 steps) external view returns (uint24 id) {
        _readHeader();
        id = from;
        for (uint256 i; i < steps; ++i) {
            uint24 next = uint24(FlatBitmap.findFirstRight(id));
            if (next == 0) break;
            id = next;
        }
    }

    function insertRange(uint24 lo, uint256 count) external {
        _readHeader();
        for (uint256 i; i < count; ++i) {
            uint24 id = lo + uint24(i);
            _writeEntryData(id);
            FlatBitmap.add(id);
        }
    }

    function insert(uint24 id) external returns (bool) {
        _readHeader();
        return FlatBitmap.add(id);
    }

    function erase(uint24 id) external returns (bool) {
        _readHeader();
        return FlatBitmap.remove(id);
    }
}
