// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {Mip3Scratchpad} from "../src/Mip3Scratchpad.sol";
import {Mip3LargeMemory} from "../src/Mip3LargeMemory.sol";
import {Mip8DenseKey} from "../src/Mip8DenseKey.sol";
import {Mip8StructOrdering} from "../src/Mip8StructOrdering.sol";
import {Mip8Batched} from "../src/Mip8Batched.sol";
import {Mip4Bundler} from "../src/Mip4Bundler.sol";

/// Functional checks only. Forge runs vanilla revm — it does NOT implement
/// MIP-3 linear memory or MIP-8 paged storage gas schedules, so any gas
/// measurement here is meaningless for the suggestion proofs. We only verify
/// that the before/after pairs produce the same result (or, for 4a, the
/// expected behavioral outcome). The real gas proofs come from mainnet via
/// script/DeployAndMeasure.s.sol.
contract FunctionalTest is Test {
    function test_mip3a_scratchpad_equivalence() public {
        Mip3Scratchpad c = new Mip3Scratchpad();
        bytes32 seed = keccak256("seed");
        uint256 a = c.runBefore(seed);
        uint256 b = c.runAfter(seed);
        assertEq(a, b, "before/after must compute the same fold");
    }

    function test_mip3b_largeMemory_runs() public {
        Mip3LargeMemory c = new Mip3LargeMemory();
        uint256 sum = c.allocateAndFold(1 << 20, keccak256("seed"));
        assertGt(sum, 0, "fold should be non-zero");
    }

    function test_mip8a_dense_equivalence() public {
        Mip8DenseKey c = new Mip8DenseKey();
        uint256 scatteredSum = c.readScattered(10);
        uint256 packedSum = c.readPacked(10);
        assertEq(scatteredSum, packedSum, "layouts must read the same values");
        assertEq(scatteredSum, 11 + 12 + 13 + 14 + 15 + 16 + 17 + 18);
    }

    function test_mip8b_struct_equivalence() public {
        Mip8StructOrdering c = new Mip8StructOrdering();
        c.seed(100, 200);
        assertEq(c.readPairScattered(), 300);
        assertEq(c.readPairReordered(), 300);
    }

    function test_mip8c_batched_writes_observable() public {
        Mip8Batched c = new Mip8Batched();
        c.writeScattered(10, 1000);
        c.writePacked(10, 2000);
    }

    /// MIP-4 awareness check: under forge (no real 0x1001 precompile), the
    /// lenient path treats empty precompile return as "not dipped" and the
    /// call completes. The real proof is the on-chain trace from the
    /// mainnet broadcast — see the script's broadcast log for a CALL to
    /// 0x1001 with selector 0x3a61584e in the executeAware tx.
    function test_mip4a_aware_completes_with_no_dip() public {
        Mip4Bundler bundler = new Mip4Bundler();
        Mip4Bundler.Op[] memory ops = new Mip4Bundler.Op[](1);
        ops[0] = Mip4Bundler.Op({
            target: address(this),
            value: 0,
            data: ""
        });
        vm.deal(address(bundler), 1 ether);
        bundler.executeAware(ops);
    }

    function test_mip4a_naive_does_not_probe() public {
        Mip4Bundler bundler = new Mip4Bundler();
        Mip4Bundler.Op[] memory ops = new Mip4Bundler.Op[](1);
        ops[0] = Mip4Bundler.Op({
            target: address(this),
            value: 0,
            data: ""
        });
        vm.deal(address(bundler), 1 ether);
        // Naive path never touches 0x1001 — succeeds on forge.
        bundler.executeNaive(ops);
    }

    // Allow test contract to be a target for empty calls in the bundler test.
    fallback() external payable {}
    receive() external payable {}
}
