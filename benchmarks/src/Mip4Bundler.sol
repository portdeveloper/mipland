// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Pattern 4a — Reserve-aware bundler entrypoint.
///
/// A minimal "bundler" that executes a sequence of inner operations, each of
/// which transfers MON to itself (simulating a UserOp that touches balance).
/// One of the ops in the test sequence pushes the account below the 10 MON
/// reserve threshold.
///
/// `executeNaive`  — runs all ops, then lets Monad revert the whole bundle at
/// tx end because reserve was violated. The revert carries no information
/// about which op was the offender. The bundler cannot blame the right UserOp.
///
/// `executeAware` — after each op, CALLs the MIP-4 precompile at 0x1001 with
/// selector `dippedIntoReserve()`. If true, it reverts immediately with
/// `BadOp(index)`, naming the offender so the bundler can drop and resubmit.
///
/// The precompile is documented in MIP-4. Selector: 0x3a61584e. Must be
/// invoked via CALL (not STATICCALL) per spec — even though the call is
/// effectively a read, the spec disallows STATICCALL.
contract Mip4Bundler {
    address constant RESERVE_PRECOMPILE = address(0x1001);
    bytes4 constant DIPPED_INTO_RESERVE_SELECTOR = 0x3a61584e;

    error BadOp(uint256 index);

    struct Op {
        address target;
        uint256 value;
        bytes data;
    }

    function executeNaive(Op[] calldata ops) external payable {
        for (uint256 i = 0; i < ops.length; i++) {
            (bool ok, ) = ops[i].target.call{value: ops[i].value}(ops[i].data);
            require(ok, "op reverted");
        }
        // No reserve check — reserve violation surfaces at tx end with no
        // information about which op caused it.
    }

    function executeAware(Op[] calldata ops) external payable {
        for (uint256 i = 0; i < ops.length; i++) {
            (bool ok, ) = ops[i].target.call{value: ops[i].value}(ops[i].data);
            require(ok, "op reverted");
            if (_dippedIntoReserve()) {
                revert BadOp(i);
            }
        }
    }

    function _dippedIntoReserve() internal returns (bool dipped) {
        (bool ok, bytes memory ret) = RESERVE_PRECOMPILE.call(
            abi.encodeWithSelector(DIPPED_INTO_RESERVE_SELECTOR)
        );
        // The call should always succeed on Monad. If the precompile is
        // absent (e.g. local revm during forge simulation), the call still
        // returns ok with empty data — treat that as "no dip" rather than
        // bricking the bundler.
        require(ok, "precompile call failed");
        if (ret.length != 32) return false;
        dipped = abi.decode(ret, (bool));
    }

    /// Sink that consumes MON to push the bundler's balance below reserve.
    /// Used as a target in test sequences.
    function drain(address payable to) external payable {
        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "drain failed");
    }

    /// Recover funds after the demo runs. Either bundler call reverts (so
    /// the temporary funding stays in the bundler) and the deployer pulls
    /// it back out via this function.
    function withdraw(address payable to) external {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    receive() external payable {}
}
