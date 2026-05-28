import measurementsJson from "../../benchmarks/measurements.json";

export type MipSlug = "mip-3" | "mip-4" | "mip-8";

export type GasProof = {
  kind: "gas-delta";
  beforeTx: `0x${string}` | null;
  afterTx: `0x${string}` | null;
  beforeGas: number | null;
  afterGas: number | null;
  beforeNote?: string;
};

export type BehaviorProof = {
  kind: "behavior";
  beforeTx: `0x${string}` | null;
  afterTx: `0x${string}` | null;
  beforeLabel: string;
  afterLabel: string;
};

export type Proof = GasProof | BehaviorProof;

export type Suggestion = {
  id: string;
  mip: MipSlug;
  titleKey: string;
  summaryKey: string;
  explanationKey: string;
  beforeCode: string;
  afterCode: string;
  proof: Proof;
  contractPath: string;
};

const measurements = measurementsJson as unknown as {
  chainId: number;
  generatedAt: string | null;
  proofs: Record<string, Proof & { beforeStatus?: string | null; afterStatus?: string | null }>;
};

export const MEASUREMENT_CHAIN_ID = measurements.chainId;
export const MEASUREMENTS_GENERATED_AT = measurements.generatedAt;

function proofFor(id: string): Proof {
  const p = measurements.proofs[id];
  if (!p) {
    return {
      kind: "gas-delta",
      beforeTx: null,
      afterTx: null,
      beforeGas: null,
      afterGas: null,
    };
  }
  return p;
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "3a",
    mip: "mip-3",
    titleKey: "mip3.suggestions.s3aTitle",
    summaryKey: "mip3.suggestions.s3aSummary",
    explanationKey: "mip3.suggestions.s3aExplanation",
    beforeCode: `bytes32[64] private scratch;

function compute(bytes32 seed) external returns (uint256 sum) {
    for (uint i = 0; i < 64; i++) {
        scratch[i] = keccak256(abi.encode(seed, i));  // SSTORE
    }
    for (uint i = 0; i < 64; i++) {
        sum += uint(scratch[i]);                       // SLOAD
    }
}`,
    afterCode: `function compute(bytes32 seed) external pure returns (uint256 sum) {
    bytes32[64] memory mem;
    for (uint i = 0; i < 64; i++) {
        mem[i] = keccak256(abi.encode(seed, i));       // MSTORE
    }
    for (uint i = 0; i < 64; i++) {
        sum += uint(mem[i]);                            // MLOAD
    }
}`,
    proof: proofFor("3a"),
    contractPath: "benchmarks/src/Mip3Scratchpad.sol",
  },
  {
    id: "3b",
    mip: "mip-3",
    titleKey: "mip3.suggestions.s3bTitle",
    summaryKey: "mip3.suggestions.s3bSummary",
    explanationKey: "mip3.suggestions.s3bExplanation",
    beforeCode: `// On Ethereum, allocating 1 MB of memory is effectively
// impossible — the quadratic formula charges ~2.3 M gas for
// memory expansion alone, before you store a single byte.
// Devs work around this by chunking, splitting across txs,
// or keeping intermediate state in storage.`,
    afterCode: `// On Monad, the same 1 MB allocation costs ~16 K gas total —
// linear in size. You can write the straight-line algorithm.
function process(bytes32 seed) external pure returns (uint256) {
    bytes memory buf = new bytes(1 << 20);  // 1 MB
    // ... fill, process, fold ...
}`,
    proof: proofFor("3b"),
    contractPath: "benchmarks/src/Mip3LargeMemory.sol",
  },
  {
    id: "8a",
    mip: "mip-8",
    titleKey: "mip8.suggestions.s8aTitle",
    summaryKey: "mip8.suggestions.s8aSummary",
    explanationKey: "mip8.suggestions.s8aExplanation",
    beforeCode: `// Keys hash to keccak-scattered slots — consecutive
// indices land on different MIP-8 pages.
mapping(uint256 => uint256) private values;

function readEight(uint256 start) external view returns (uint256 sum) {
    for (uint i = 0; i < 8; i++) {
        sum += values[start + i];   // 8 cold-page loads
    }
}`,
    afterCode: `// Adjacent slots — 8 entries fit comfortably in one page.
uint256[256] private values;

function readEight(uint256 start) external view returns (uint256 sum) {
    for (uint i = 0; i < 8; i++) {
        sum += values[start + i];   // 1 cold page + 7 warm
    }
}`,
    proof: proofFor("8a"),
    contractPath: "benchmarks/src/Mip8DenseKey.sol",
  },
  {
    id: "8b",
    mip: "mip-8",
    titleKey: "mip8.suggestions.s8bTitle",
    summaryKey: "mip8.suggestions.s8bSummary",
    explanationKey: "mip8.suggestions.s8bExplanation",
    beforeCode: `struct User {
    uint256 stake;       // hot
    uint256 _filler0;    // 6 cold fields
    uint256 _filler1;
    uint256 _filler2;
    uint256 _filler3;
    uint256 _filler4;
    uint256 _filler5;
    uint256 lastClaim;   // hot — but 7 slots away
}

// Reading both pays two cold-page loads.`,
    afterCode: `struct User {
    uint256 stake;       // hot
    uint256 lastClaim;   // hot — adjacent
    uint256 _filler0;
    uint256 _filler1;
    uint256 _filler2;
    uint256 _filler3;
    uint256 _filler4;
    uint256 _filler5;
}

// One cold-page load + one warm slot read.`,
    proof: proofFor("8b"),
    contractPath: "benchmarks/src/Mip8StructOrdering.sol",
  },
  {
    id: "8c",
    mip: "mip-8",
    titleKey: "mip8.suggestions.s8cTitle",
    summaryKey: "mip8.suggestions.s8cSummary",
    explanationKey: "mip8.suggestions.s8cExplanation",
    beforeCode: `// Mapping keys hash to slots on different pages.
mapping(uint256 => uint256) private entries;

function allocate(uint256 count, uint256 base) external {
    for (uint i = 0; i < count; i++) {
        entries[i] = base + i;   // each on a new page
    }                            // → count × STATE_GROWTH_COST
}`,
    afterCode: `// Adjacent storage slots — one page covers many entries.
uint256[1024] private entries;

function allocate(uint256 count, uint256 base) external {
    for (uint i = 0; i < count; i++) {
        entries[i] = base + i;   // same page after the first
    }                            // → 1 × STATE_GROWTH_COST
}`,
    proof: proofFor("8c"),
    contractPath: "benchmarks/src/Mip8Batched.sol",
  },
  {
    id: "4a",
    mip: "mip-4",
    titleKey: "mip4.suggestions.s4aTitle",
    summaryKey: "mip4.suggestions.s4aSummary",
    explanationKey: "mip4.suggestions.s4aExplanation",
    beforeCode: `function executeNaive(Op[] calldata ops) external payable {
    for (uint256 i = 0; i < ops.length; i++) {
        (bool ok, ) = ops[i].target.call{value: ops[i].value}(ops[i].data);
        require(ok, "op reverted");
    }
    // If one of the ops dropped the bundler below 10 MON reserve,
    // the WHOLE tx reverts at completion. The bundler has no way
    // to tell which op was the offender.
}`,
    afterCode: `address constant RESERVE_PRECOMPILE = address(0x1001);
bytes4 constant DIPPED = 0x3a61584e;

function executeAware(Op[] calldata ops) external payable {
    for (uint256 i = 0; i < ops.length; i++) {
        (bool ok, ) = ops[i].target.call{value: ops[i].value}(ops[i].data);
        require(ok, "op reverted");
        // CALL (not STATICCALL) — required by MIP-4 spec.
        (bool pOk, bytes memory r) = RESERVE_PRECOMPILE.call(
            abi.encodeWithSelector(DIPPED)
        );
        require(pOk && r.length == 32);
        if (abi.decode(r, (bool))) revert BadOp(i);
    }
}`,
    proof: proofFor("4a"),
    contractPath: "benchmarks/src/Mip4Bundler.sol",
  },
];

export function suggestionsFor(mip: MipSlug): Suggestion[] {
  return SUGGESTIONS.filter((s) => s.mip === mip);
}
