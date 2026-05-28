// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {Mip3Scratchpad} from "../src/Mip3Scratchpad.sol";
import {Mip3LargeMemory} from "../src/Mip3LargeMemory.sol";
import {Mip8DenseKey} from "../src/Mip8DenseKey.sol";
import {Mip8StructOrdering} from "../src/Mip8StructOrdering.sol";
import {Mip8Batched} from "../src/Mip8Batched.sol";
import {Mip4Bundler} from "../src/Mip4Bundler.sol";

/// Deploys every benchmark contract and invokes the before/after calls.
/// Run with --broadcast to actually send txs and produce a broadcast log
/// under broadcast/DeployAndMeasure.s.sol/<chainId>/run-latest.json. The
/// log contains tx hashes + receipts (with gasUsed). A post-process script
/// (script/postprocess.mjs) converts that into the final measurements.json
/// consumed by mipland.
///
/// MIP-4 path note: contracts (non-EIP-7702) are exempt from the reserve
/// requirement, so a contract bundler can't be pushed below reserve to
/// produce a revert. The demo therefore runs zero-value ops; both
/// executeNaive and executeAware succeed. The proof value is in the trace
/// of the aware tx, which contains a correct CALL to 0x1001 with the
/// dippedIntoReserve selector — exactly the integration pattern the
/// suggestion is teaching. The naive tx's trace contains no such call.
contract DeployAndMeasure is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address payable sink = payable(address(0xdEaD));
        (sink); // silence unused warning if future sequences drop the address

        vm.startBroadcast(pk);

        // -------- 3a: Mid-tx scratchpad --------
        Mip3Scratchpad scratchpad = new Mip3Scratchpad();
        scratchpad.runBefore(keccak256("3a"));
        scratchpad.runAfter(keccak256("3a"));

        // -------- 3b: Large memory allocation --------
        Mip3LargeMemory largeMemory = new Mip3LargeMemory();
        largeMemory.allocateAndFold(1 << 20, keccak256("3b")); // 1 MB

        // -------- 8a: Dense-key lookup (mapping vs packed array) --------
        Mip8DenseKey denseKey = new Mip8DenseKey();
        denseKey.readScattered(100);
        denseKey.readPacked(100);

        // -------- 8b: Struct field reordering --------
        Mip8StructOrdering structOrdering = new Mip8StructOrdering();
        structOrdering.seed(1000, 2000);
        structOrdering.readPairScattered();
        structOrdering.readPairReordered();

        // -------- 8c: Batched state growth --------
        Mip8Batched batched = new Mip8Batched();
        batched.writeScattered(10, 1000);
        batched.writePacked(10, 2000);

        // -------- 4a: Reserve-aware bundler --------
        Mip4Bundler bundler = new Mip4Bundler();
        Mip4Bundler.Op[] memory ops = new Mip4Bundler.Op[](1);
        ops[0] = Mip4Bundler.Op({
            target: address(bundler),
            value: 0,
            data: ""
        });

        // Both calls succeed. The proof is the trace of the aware call: it
        // contains a CALL to 0x1001 with the dippedIntoReserve selector. The
        // naive call's trace has no such sub-call.
        bundler.executeNaive(ops);
        bundler.executeAware(ops);

        vm.stopBroadcast();

        // Print addresses for the postprocess script to discover. Forge's
        // broadcast log keeps the function-call/transaction order so the
        // postprocess script can match calls to addresses by replaying the
        // declared order above.
        console2.log("Mip3Scratchpad",   address(scratchpad));
        console2.log("Mip3LargeMemory",  address(largeMemory));
        console2.log("Mip8DenseKey",     address(denseKey));
        console2.log("Mip8StructOrdering", address(structOrdering));
        console2.log("Mip8Batched",      address(batched));
        console2.log("Mip4Bundler",      address(bundler));
    }
}

// Address(0xdEaD) silence: see top of contract.
