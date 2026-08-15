// SPDX-License-Identifier: MIT
pragma solidity ^0.8.31;

import { Test, console } from "forge-std/Test.sol";
import { HostBase, HostPageBitTree, HostFlatBitmap } from "../src/mip8/page-bit-tree/Harness.sol";

/// @notice Detects the live gas schedule so the benchmark can refuse to report meaningless
///         numbers. See `HostBase.probeSchedule`.
library Schedule {
    /// @dev A second read on an already-touched page: ~100 under MIP-8, ~2100 without.
    function isMip8(address host) internal view returns (bool) {
        return HostBase(host).probeSchedule() < 1000;
    }
}

/**
 * @notice Does a summary level earn its place on top of a page-aware bitmap? Every write case,
 *         then searches at widening gaps, two-level against one-level.
 *
 * @dev REQUIRES an MIP-8 gas schedule. Under vanilla revm every scanned word is its own cold
 *      slot and the answers invert -- see `PreflightTest`, which fails loudly
 *      rather than let the suite print plausible, internally consistent, wrong numbers.
 *
 * @dev THE MEASUREMENT RULES. Four things silently produce confident wrong numbers here, and
 *      every one of them cost a wrong conclusion before it was caught:
 *
 *      1. Storage touched in a test body stays warm for the rest of that body. Seeding must
 *         happen in `setUp`, which is why this file is one contract per scenario rather than
 *         one contract with many test functions.
 *      2. Reading a contract-typed state variable is an SLOAD INSIDE the measured window.
 *         Two such fields are usually adjacent slots on one page, so the harness's own storage
 *         dominates the delta. Addresses are hoisted into locals before the window opens.
 *      3. `vm.startStateDiffRecording()` warms storage. Gas and access counts cannot come from
 *         the same call. This file records nothing.
 *      4. A scanned word costs ~201, not the 100 the schedule implies. The extra is loop
 *         compute. Negligible for O(1) work, half the cost of an O(k) scan, and it decides
 *         every wide-gap row below.
 *
 *      The account is also pre-warmed and an empty `noop()` subtracted, so what remains is the
 *      operation and nothing else.
 *
 * @dev THE SCENARIOS. Probe id 8,420,000 is leaf 256 / word 122 for the two-level structure
 *      and word 32,890 for the flat one. `+1` stays inside the word, `+300` moves to the next
 *      word, `+32,768` moves to the next leaf -- which is also the next page, since a leaf is
 *      exactly one page.
 */
abstract contract GasBase is Test {
    HostPageBitTree internal tree;
    HostFlatBitmap internal flat;

    uint24 internal constant PROBE = 8_420_000;

    function setUp() public {
        tree = new HostPageBitTree();
        flat = new HostFlatBitmap();
        tree.init(PROBE);
        flat.init(PROBE);
        _seed();
    }

    function _seed() internal virtual { }

    function _run() internal view virtual returns (bytes memory, bytes memory);

    function label() internal pure virtual returns (string memory);

    function test_gas() public {
        if (!Schedule.isMip8(address(flat))) {
            vm.skip(true);
            return;
        }
        // Rule 2: hoist before the window opens.
        HostPageBitTree a = tree;
        HostFlatBitmap b = flat;
        (bytes memory ca, bytes memory cb) = _run();

        uint256 ga = _time(address(a), ca) - _overhead(address(a));
        uint256 gb = _time(address(b), cb) - _overhead(address(b));

        console.log(
            string.concat(
                "  ",
                label(),
                _pad(vm.toString(ga), 9),
                _pad(vm.toString(gb), 10),
                "   ",
                gb <= ga
                    ? string.concat("-", vm.toString(ga - gb))
                    : string.concat("+", vm.toString(gb - ga))
            )
        );
    }

    /// @dev Pre-warms the account, then measures an empty external call.
    function _overhead(address t) private returns (uint256) {
        bytes memory n = abi.encodeWithSignature("noop()");
        (bool w,) = t.call(n);
        require(w, "warm-up failed");
        return _time(t, n);
    }

    function _time(address t, bytes memory d) private returns (uint256) {
        uint256 g0 = gasleft();
        (bool ok,) = t.call(d);
        uint256 g1 = gasleft();
        require(ok, "reverted");
        return g0 - g1;
    }

    function _pad(string memory v, uint256 w) internal pure returns (string memory) {
        bytes memory b = bytes(v);
        if (b.length >= w) return v;
        bytes memory o = new bytes(w);
        for (uint256 i; i < w - b.length; ++i) {
            o[i] = " ";
        }
        for (uint256 i; i < b.length; ++i) {
            o[w - b.length + i] = b[i];
        }
        return string(o);
    }
}

/*//////////////////////////////////////////////////////////////
                            PREFLIGHT
//////////////////////////////////////////////////////////////*/

/**
 * @notice Guards the benchmark against being believed on the wrong EVM.
 *
 * @dev Two failure modes, handled differently on purpose:
 *
 *      - Plain `forge test` on vanilla revm: the gas scenarios SKIP. Nothing is claimed, and
 *        the repo's default test run stays green.
 *      - `FOUNDRY_PROFILE=mip8` without Monad's Foundry build: FAIL LOUDLY. Asking for MIP-8
 *        and silently getting vanilla is the mistake that produces confident wrong numbers,
 *        and it inverts most rows in this file rather than merely shifting them.
 */
contract PreflightTest is Test {
    HostFlatBitmap internal host;

    function setUp() public {
        host = new HostFlatBitmap();
        host.init(8_420_000);
    }

    /**
     * @dev Measures the marginal cost of a second read on the SAME page: ~100 under MIP-8,
     *      ~2100 without. Total call cost cannot be used for this -- one cold read plus call
     *      overhead already exceeds 8000 gas on vanilla revm, so a threshold on the whole call
     *      passes everywhere and guards nothing.
     */
    function test_preflight_scheduleMatchesProfile() public {
        uint256 marginal = host.probeSchedule();
        bool asked = keccak256(bytes(vm.envOr("FOUNDRY_PROFILE", string("")))) == keccak256("mip8");

        if (!asked) {
            vm.skip(marginal >= 1000);
            return;
        }
        assertLt(
            marginal,
            1000,
            string.concat(
                "FOUNDRY_PROFILE=mip8 was requested but a second same-page read cost ",
                vm.toString(marginal),
                " gas, so this is NOT an MIP-8 schedule. Run under Monad's Foundry build."
            )
        );
    }
}

/*//////////////////////////////////////////////////////////////
                              INSERT
//////////////////////////////////////////////////////////////*/

/// @dev Bit already set: one read, no write. The delta is the root SLOAD and nothing else.
contract GasInsertPresent is GasBase {
    function label() internal pure override returns (string memory) {
        return "insert, id already present    ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        flat.add(PROBE);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.insert, (PROBE)), abi.encodeCall(flat.insert, (PROBE)));
    }
}

/// @dev The word already holds bits, so neither structure propagates.
contract GasInsertLiveWord is GasBase {
    function label() internal pure override returns (string memory) {
        return "insert, live word     (+1)    ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        flat.add(PROBE);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.insert, (PROBE + 1)), abi.encodeCall(flat.insert, (PROBE + 1)));
    }
}

/// @dev A net-new slot on a page that already exists: +17,100 for both.
contract GasInsertNewWord is GasBase {
    function label() internal pure override returns (string memory) {
        return "insert, new word    (+300)    ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        flat.add(PROBE);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return
            (abi.encodeCall(tree.insert, (PROBE + 300)), abi.encodeCall(flat.insert, (PROBE + 300)));
    }
}

/// @dev A whole new page. For the two-level structure that is a new leaf, so a root bit is
///      set: the first write to page 0 this transaction, 2800 + 100.
contract GasInsertNewPage is GasBase {
    function label() internal pure override returns (string memory) {
        return "insert, new page  (+32768)    ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        flat.add(PROBE);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (
            abi.encodeCall(tree.insert, (PROBE + 32_768)),
            abi.encodeCall(flat.insert, (PROBE + 32_768))
        );
    }
}

/// @dev Nothing exists yet, so the root word itself is a net-new nonzero slot: +17,100 on top.
contract GasInsertFirstEver is GasBase {
    function label() internal pure override returns (string memory) {
        return "insert, first id ever         ";
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.insert, (PROBE)), abi.encodeCall(flat.insert, (PROBE)));
    }
}

/*//////////////////////////////////////////////////////////////
                              REMOVE
//////////////////////////////////////////////////////////////*/

/// @dev Bit not set: one read, no write.
contract GasRemoveAbsent is GasBase {
    function label() internal pure override returns (string memory) {
        return "remove, id not present        ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        flat.add(PROBE);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.erase, (PROBE + 1)), abi.encodeCall(flat.erase, (PROBE + 1)));
    }
}

/// @dev Other bits remain in the word, so there is nothing to propagate and nothing to prove.
contract GasRemoveWordSurvives is GasBase {
    function label() internal pure override returns (string memory) {
        return "remove, word survives         ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        tree.add(PROBE + 1);
        flat.add(PROBE);
        flat.add(PROBE + 1);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.erase, (PROBE + 1)), abi.encodeCall(flat.erase, (PROBE + 1)));
    }
}

/// @dev The word empties but the leaf does not. The two-level structure has to scan to learn
///      that; the survivor is adjacent, so it learns it quickly.
contract GasRemoveWordEmpties is GasBase {
    function label() internal pure override returns (string memory) {
        return "remove, word empties          ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        tree.add(PROBE + 300);
        flat.add(PROBE);
        flat.add(PROBE + 300);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return
            (abi.encodeCall(tree.erase, (PROBE + 300)), abi.encodeCall(flat.erase, (PROBE + 300)));
    }
}

/// @dev The worst row for a summary level. Clearing the root bit is only legal once the leaf
///      is proven empty, and with no index inside the leaf that proof is a full 128-word scan.
contract GasRemoveLastInPage is GasBase {
    function label() internal pure override returns (string memory) {
        return "remove, last id in page       ";
    }

    function _seed() internal override {
        tree.add(PROBE);
        tree.add(PROBE + 32_768);
        flat.add(PROBE);
        flat.add(PROBE + 32_768);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.erase, (PROBE)), abi.encodeCall(flat.erase, (PROBE)));
    }
}

/*//////////////////////////////////////////////////////////////
                              SEARCH
//////////////////////////////////////////////////////////////*/

/// @dev One id, `gapWords()` words below the probe. This is where the root earns back what it
///      costs -- it turns a walk into a bitmap lookup.
abstract contract GasSearch is GasBase {
    function gapWords() internal pure virtual returns (uint24);

    function _seed() internal override {
        uint24 t = PROBE - gapWords() * 256 - 40;
        tree.add(t);
        flat.add(t);
    }

    function _run() internal view override returns (bytes memory, bytes memory) {
        return (abi.encodeCall(tree.findRight, (PROBE)), abi.encodeCall(flat.findRight, (PROBE)));
    }
}

contract GasSearch1 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 1;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap   1 word          ";
    }
}

contract GasSearch40 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 40;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap  40 words         ";
    }
}

contract GasSearch128 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 128;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap 128 words         ";
    }
}

/// @dev Still inside the region where walking beats nothing. The flat bitmap is ahead here.
contract GasSearch200 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 200;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap 200 words         ";
    }
}

/// @dev The crossover. Past here the walk costs more than the root ever saved.
contract GasSearch256 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 256;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap 256 words         ";
    }
}

contract GasSearch400 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 400;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap 400 words         ";
    }
}

contract GasSearch600 is GasSearch {
    function gapWords() internal pure override returns (uint24) {
        return 600;
    }

    function label() internal pure override returns (string memory) {
        return "search, gap 600 words         ";
    }
}
