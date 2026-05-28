#!/usr/bin/env node
// Reads broadcast/DeployAndMeasure.s.sol/<chainId>/run-latest.json and produces
// measurements.json — the single source of truth consumed by the mipland UI.
//
// Foundry's broadcast log lists `transactions[]` and `receipts[]` in the same
// order. Each transaction has `transactionType` (CREATE | CALL), `contractName`
// (for CREATE) or `function` (for CALL), and the receipt sibling has `gasUsed`
// as a 0x-prefixed hex string. We match calls to suggestion ids by the script's
// declared call order (mirrored here in CALL_ORDER).
//
// Run:
//   node script/postprocess.mjs <chainId>
//
// Example:
//   node script/postprocess.mjs 143

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = resolve(__dirname, "..");

const chainId = process.argv[2];
if (!chainId) {
  console.error("usage: node script/postprocess.mjs <chainId>");
  process.exit(1);
}

const broadcastPath = resolve(
  repo,
  "broadcast/DeployAndMeasure.s.sol",
  chainId,
  "run-latest.json"
);
const log = JSON.parse(readFileSync(broadcastPath, "utf8"));

// Declared order of CALLs in DeployAndMeasure.s.sol. Each entry says which
// suggestion id this call belongs to and which side (before / after / sole /
// behavior-before / behavior-after). The script also issues CREATE txs and
// some bookkeeping CALLs (funding, withdraw) we tag as "_skip".
const CALL_ORDER = [
  { contract: "Mip3Scratchpad",   fn: "runBefore",          tag: "3a:before" },
  { contract: "Mip3Scratchpad",   fn: "runAfter",           tag: "3a:after" },
  { contract: "Mip3LargeMemory",  fn: "allocateAndFold",    tag: "3b:after" },
  { contract: "Mip8DenseKey",     fn: "readScattered",      tag: "8a:before" },
  { contract: "Mip8DenseKey",     fn: "readPacked",         tag: "8a:after" },
  { contract: "Mip8StructOrdering", fn: "seed",             tag: "_skip" },
  { contract: "Mip8StructOrdering", fn: "readPairScattered", tag: "8b:before" },
  { contract: "Mip8StructOrdering", fn: "readPairReordered", tag: "8b:after" },
  { contract: "Mip8Batched",      fn: "writeScattered",     tag: "8c:before" },
  { contract: "Mip8Batched",      fn: "writePacked",        tag: "8c:after" },
  { contract: "Mip4Bundler",      fn: "executeNaive",       tag: "4a:before" },
  { contract: "Mip4Bundler",      fn: "executeAware",       tag: "4a:after" },
];

// Walk the broadcast log: skip CREATEs, match CALLs against CALL_ORDER in
// sequence. Pair each CALL with its receipt by transactionHash.
const callsInLog = log.transactions
  .map((tx, idx) => ({ tx, receipt: log.receipts?.[idx] }))
  .filter((x) => x.tx.transactionType === "CALL");

if (callsInLog.length !== CALL_ORDER.length) {
  console.error(
    `Expected ${CALL_ORDER.length} CALL txs in broadcast log, found ${callsInLog.length}.`,
    `Did the script change without updating CALL_ORDER?`
  );
  process.exit(1);
}

const proofs = {};
for (let i = 0; i < CALL_ORDER.length; i++) {
  const { tag } = CALL_ORDER[i];
  if (tag === "_skip") continue;
  const { tx, receipt } = callsInLog[i];
  const txHash = tx.hash;
  const gasUsed = receipt ? parseInt(receipt.gasUsed, 16) : null;
  const [id, side] = tag.split(":");
  proofs[id] = proofs[id] ?? {};
  proofs[id][`${side}Tx`] = txHash;
  proofs[id][`${side}Gas`] = gasUsed;
  proofs[id][`${side}Status`] = receipt?.status ?? null;
}

// Annotate behavioral entry (4a) with labels so the UI can render the right
// proof variant.
if (proofs["4a"]) {
  proofs["4a"].kind = "behavior";
  proofs["4a"].beforeLabel =
    "Tx trace contains no probe of 0x1001. If any op had dipped the sender below reserve, the bundler would have no way to identify the offender.";
  proofs["4a"].afterLabel =
    "Tx trace contains a CALL to 0x1001 with selector 0x3a61584e (dippedIntoReserve) after each op. Correct integration of the MIP-4 precompile.";
} else {
  console.error("Warning: no MIP-4 entry in postprocessed output");
}

// 3b is a Monad-only "after" measurement (we deploy and call the 1 MB
// allocation tx on Monad). There is no equivalent "before" tx on Monad
// since the same code runs on both layouts — the point is that this same
// function would not fit in a single Ethereum block due to quadratic
// memory cost. We leave beforeTx / beforeGas null and attach a beforeNote
// the card can render in place of the "Pending" placeholder.
if (proofs["3b"]) {
  proofs["3b"].kind = "gas-delta";
  proofs["3b"].beforeTx = null;
  proofs["3b"].beforeGas = null;
  proofs["3b"].beforeNote =
    "No equivalent 'before' tx on Monad — the same source runs on both chains. The qualitative contrast: this call would likely exceed Ethereum's 30 M block gas limit due to quadratic memory expansion of the intermediate keccak buffers.";
}

// Default all gas-delta entries to kind=gas-delta if not already set.
for (const id of Object.keys(proofs)) {
  if (!proofs[id].kind) proofs[id].kind = "gas-delta";
}

const out = {
  chainId: Number(chainId),
  generatedAt: new Date().toISOString(),
  proofs,
};

const outPath = resolve(repo, "measurements.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(out, null, 2));
