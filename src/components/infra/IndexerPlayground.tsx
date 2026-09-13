"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useMemo } from "react";
import CodeBlock from "./CodeBlock";
import { useCopyToClipboard } from "./useCopyToClipboard";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface EventLog {
  address: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  txHash: string;
}

type Step = "idle" | "fetching" | "decoding" | "done";

/* ─── Frameworks (from Monad docs) ───────────────────────────────────── */

const FRAMEWORKS = [
  { id: "envio", name: "Envio", ready: true },
  { id: "thegraph", name: "The Graph", ready: false },
  { id: "goldsky", name: "Goldsky", ready: false },
  { id: "ghost", name: "Ghost", ready: false },
  { id: "sentio", name: "Sentio", ready: false },
  { id: "sqd", name: "SQD", ready: false },
  { id: "subquery", name: "SubQuery", ready: false },
  { id: "streamingfast", name: "Streamingfast", ready: false },
];

/* ─── Known contracts on Monad mainnet ───────────────────────────────── */

const KNOWN_CONTRACTS = [
  { label: "All contracts", address: "", description: "Any contract" },
  { label: "WMON", address: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A", description: "Wrapped MON" },
  { label: "USDC", address: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603", description: "USD Coin" },
  { label: "WETH", address: "0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242", description: "Wrapped Ether" },
  { label: "USDT", address: "0xe7cd86e13AC4309349F30B3435a9d337750fC82D", description: "Tether USD" },
  { label: "WBTC", address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c", description: "Wrapped Bitcoin" },
];

/* ─── Event types ────────────────────────────────────────────────────── */

const EVENT_TYPES = [
  {
    id: "transfer",
    label: "ERC-20 Transfer",
    topic: "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    signature: "Transfer(address,address,uint256)",
    signatureIndexed: "Transfer(address indexed from, address indexed to, uint256 value)",
  },
  {
    id: "approval",
    label: "ERC-20 Approval",
    topic: "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
    signature: "Approval(address,address,uint256)",
    signatureIndexed: "Approval(address indexed owner, address indexed spender, uint256 value)",
  },
];

const BLOCK_RANGES = [
  { label: "5 blocks", value: 5 },
  { label: "20 blocks", value: 20 },
  { label: "100 blocks", value: 100 },
];

/* ─── Helpers ────────────────────────────────────────────────────────── */

const RPC_URL = "https://rpc.monad.xyz";

function shortenAddr(addr: string): string {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatValue(hex: string): string {
  const raw = BigInt(hex || "0x0");
  const asEther = Number(raw) / 1e18;
  if (asEther >= 0.001) return asEther.toFixed(4);
  const as6 = Number(raw) / 1e6;
  if (as6 >= 0.001) return as6.toFixed(2);
  return raw.toString();
}

/* ─── Code snippets (verified against Monad docs) ────────────────────── */

function getHyperSyncSnippet(eventType: typeof EVENT_TYPES[0], contractAddr: string): string {
  const isTransfer = eventType.id === "transfer";
  const addrLine = contractAddr
    ? `        address: ["${contractAddr}"],`
    : `        // address: ["0xYourContract"],  // omit to query all`;
  return `// Envio HyperSync — query millions of events in seconds
// Get a free API key at https://app.envio.dev/api-tokens

const HYPERSYNC_URL = "https://monad.hypersync.xyz";
const API_KEY = process.env.HYPERSYNC_BEARER_TOKEN;

// keccak256("${eventType.signature}")
const ${eventType.id.toUpperCase()}_TOPIC =
  "${eventType.topic}";

async function query${isTransfer ? "Transfers" : "Approvals"}(fromBlock = 0) {
  const response = await fetch(\`\${HYPERSYNC_URL}/query\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${API_KEY}\`,
    },
    body: JSON.stringify({
      from_block: fromBlock,
      logs: [{
${addrLine}
        topics: [[${eventType.id.toUpperCase()}_TOPIC]],
      }],
      field_selection: {
        log: ["topic0", "topic1", "topic2", "data"],
      },
    }),
  });

  return response.json();
}

// Parse addresses from 32-byte topics (last 20 bytes)
function parseAddress(topic) {
  return "0x" + topic.slice(-40).toLowerCase();
}

// Paginate through all results
async function fetchAll() {
  const results = [];
  let fromBlock = 0;

  while (true) {
    const response = await query${isTransfer ? "Transfers" : "Approvals"}(fromBlock);

    for (const block of response.data) {
      for (const log of block.logs) {
        results.push({
          ${isTransfer ? "from" : "owner"}: parseAddress(log.topic1),
          ${isTransfer ? "to" : "spender"}: parseAddress(log.topic2),
          value: BigInt(log.data),
        });
      }
    }

    // Check for more pages
    if (response.next_block && response.next_block > fromBlock) {
      fromBlock = response.next_block;
    } else {
      break;
    }
  }

  return results;
}

const events = await fetchAll();
console.log(\`Found \${events.length} ${isTransfer ? "transfers" : "approvals"}\`);`;
}

function getHyperIndexSnippet(eventType: typeof EVENT_TYPES[0], contractAddr: string): string {
  const isTransfer = eventType.id === "transfer";
  return `# Envio HyperIndex — hosted indexer with GraphQL API
# npx envio init  (to scaffold a new project)

# ── config.yaml ──────────────────────────────────
name: monad-${eventType.id}-indexer
networks:
  - id: 10143  # Monad mainnet
    start_block: 0
    contracts:
      - name: ERC20
        address:
          - "${contractAddr || "0xYourTokenContract"}"
        handler: src/EventHandlers.ts
        events:
          - event: "${eventType.signatureIndexed}"

# ── schema.graphql ───────────────────────────────
# type ${isTransfer ? "Transfer" : "Approval"} @entity {
#   id: ID!
#   ${isTransfer ? "from: String!" : "owner: String!"}
#   ${isTransfer ? "to: String!" : "spender: String!"}
#   value: BigInt!
#   blockNumber: Int!
# }

# ── src/EventHandlers.ts ────────────────────────
import { ERC20 } from "generated";

ERC20.${isTransfer ? "Transfer" : "Approval"}.handler(async ({ event, context }) => {
  context.${isTransfer ? "Transfer" : "Approval"}.set({
    id: event.transaction.hash + "-" + event.logIndex,
    ${isTransfer ? "from: event.params.from," : "owner: event.params.owner,"}
    ${isTransfer ? "to: event.params.to," : "spender: event.params.spender,"}
    value: event.params.value,
    blockNumber: event.block.number,
  });
});

# Deploy: npx envio dev  (local) or push to envio.dev
# Then query via GraphQL:
#
# {
#   ${isTransfer ? "transfers" : "approvals"}(first: 10, orderBy: "blockNumber", orderDirection: "desc") {
#     ${isTransfer ? "from to" : "owner spender"} value blockNumber
#   }
# }`;
}

function getAIPrompt(eventType: typeof EVENT_TYPES[0], blockRange: number, contractAddr: string): string {
  return `I want to index ${eventType.label} events on Monad using Envio.${contractAddr ? `\nTarget contract: ${contractAddr}` : ""}

## Option 1: Envio HyperSync (raw query API)
Best for: one-off queries, scripts, token snapshots
${getHyperSyncSnippet(eventType, contractAddr)}

## Option 2: Envio HyperIndex (hosted indexer)
Best for: production apps that need a persistent GraphQL API
${getHyperIndexSnippet(eventType, contractAddr)}

## Setup
1. Get a free HyperSync API key: https://app.envio.dev/api-tokens
2. For HyperIndex: npx envio init
3. HyperSync endpoint: https://monad.hypersync.xyz (mainnet)
4. HyperSync endpoint: https://monad-testnet.hypersync.xyz (testnet)

## Known Monad mainnet contracts
- WMON: 0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A
- USDC: 0x754704Bc059F8C67012fEd69BC8A327a5aafb603
- WETH: 0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242
- USDT: 0xe7cd86e13AC4309349F30B3435a9d337750fC82D
- WBTC: 0x0555E30da8f98308EdB960aa94C0Db47230d2B9c

## Key details
- Monad mainnet chain ID: 10143
- ${eventType.label} topic: ${eventType.topic}
- HyperSync returns paginated results — always check next_block
- Topics are 32-byte hex: addresses are in the last 20 bytes
- Envio docs: https://docs.envio.dev/

## Other indexing frameworks on Monad
- The Graph: https://thegraph.com/docs/
- Goldsky: https://docs.goldsky.com/
- Ghost: https://docs.ghost.ac/
- Sentio: https://docs.sentio.xyz/
- SQD: https://docs.sqd.ai/
- SubQuery: https://academy.subquery.network/
- Streamingfast: https://substreams.streamingfast.io/

Integrate this into my project following my existing code patterns.`;
}

/* ─── Main component ─────────────────────────────────────────────────── */

export default function IndexerPlayground() {
  const [eventType, setEventType] = useState(0);
  const [blockRange, setBlockRange] = useState(1);
  const [contractIndex, setContractIndex] = useState(0);
  const [customAddress, setCustomAddress] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const { copied, copyFailed, copy } = useCopyToClipboard();
  const [codeTab, setCodeTab] = useState<"hypersync" | "hyperindex">("hypersync");
  const [frameworkId, setFrameworkId] = useState("envio");
  const [showCode, setShowCode] = useState(false);

  const evt = EVENT_TYPES[eventType];
  const range = BLOCK_RANGES[blockRange];
  const activeAddress =
    contractIndex === -1
      ? customAddress
      : KNOWN_CONTRACTS[contractIndex].address;

  // Live request preview that updates as user changes parameters
  const requestPreview = useMemo(() => {
    const filter: Record<string, unknown> = {
      fromBlock: `latest - ${range.value}`,
      toBlock: "latest",
      topics: [evt.topic.slice(0, 10) + "..."],
    };
    if (activeAddress) {
      filter.address = activeAddress.slice(0, 10) + "...";
    }
    return JSON.stringify(
      { jsonrpc: "2.0", method: "eth_getLogs", params: [filter], id: 1 },
      null,
      2
    );
  }, [evt.topic, range.value, activeAddress]);

  const runQuery = useCallback(async () => {
    setStep("fetching");
    setError(null);
    setLogs([]);
    setRevealIndex(-1);
    setTotalCount(0);

    try {
      const t0 = performance.now();

      const blockRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      });
      const blockData = await blockRes.json();
      const latest = parseInt(blockData.result, 16);
      const from = latest - range.value;

      const logFilter: Record<string, unknown> = {
        fromBlock: "0x" + from.toString(16),
        toBlock: "0x" + latest.toString(16),
        topics: [evt.topic],
      };
      if (activeAddress) {
        logFilter.address = activeAddress;
      }

      const logsRes = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getLogs",
          params: [logFilter],
          id: 2,
        }),
      });

      const t1 = performance.now();
      setLatencyMs(Math.round(t1 - t0));

      const logsData = await logsRes.json();
      if (logsData.error) throw new Error(logsData.error.message);

      const rawLogs = logsData.result as Array<{
        address: string;
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
      }>;

      setTotalCount(rawLogs.length);

      const decoded: EventLog[] = rawLogs.slice(0, 12).map((log) => ({
        address: log.address,
        from: log.topics[1] ? "0x" + log.topics[1].slice(26) : "?",
        to: log.topics[2] ? "0x" + log.topics[2].slice(26) : "?",
        value: formatValue(log.data),
        blockNumber: parseInt(log.blockNumber, 16),
        txHash: log.transactionHash,
      }));

      setLogs(decoded);
      setStep("decoding");

      for (let i = 0; i < decoded.length; i++) {
        await new Promise((r) => setTimeout(r, 100));
        setRevealIndex(i);
      }

      await new Promise((r) => setTimeout(r, 200));
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setStep("idle");
    }
  }, [evt.topic, range.value, activeAddress]);

  const resetQuery = () => {
    setStep("idle");
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Framework tabs */}
      <div>
        <p className="font-mono text-[11px] text-text-tertiary mb-3">
          Pick a framework
        </p>
        <div className="flex flex-wrap gap-2">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id}
              onClick={() => f.ready && setFrameworkId(f.id)}
              disabled={!f.ready}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                frameworkId === f.id
                  ? "bg-solution-accent text-white border-solution-accent"
                  : f.ready
                  ? "bg-surface-elevated text-text-secondary border-border hover:border-text-tertiary"
                  : "text-text-tertiary/30 border-border/40 cursor-default"
              }`}
            >
              {f.name}
              {!f.ready && (
                <span className="ml-1.5 text-[10px] opacity-50">soon</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Query builder + results ─────────────────────────────── */}
        <div className="bg-surface-elevated rounded-2xl border border-border p-6 space-y-5">
          {/* Contract picker */}
          <div>
            <p className="font-mono text-[11px] text-text-tertiary mb-3">
              Contract
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {KNOWN_CONTRACTS.map((c, i) => (
                <button
                  key={c.label}
                  onClick={() => {
                    setContractIndex(i);
                    resetQuery();
                  }}
                  className={`font-mono text-sm px-3 py-2 rounded-lg border transition-all ${
                    contractIndex === i
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setContractIndex(-1);
                  resetQuery();
                }}
                className={`font-mono text-sm px-3 py-2 rounded-lg border transition-all ${
                  contractIndex === -1
                    ? "bg-text-primary text-surface border-text-primary"
                    : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                }`}
              >
                Custom
              </button>
            </div>
            {contractIndex === -1 && (
              <motion.input
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                type="text"
                placeholder="0x..."
                value={customAddress}
                onChange={(e) => {
                  setCustomAddress(e.target.value);
                  resetQuery();
                }}
                className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-tertiary/40 focus:outline-none focus:border-text-tertiary"
              />
            )}
            {contractIndex > 0 && (
              <p className="font-mono text-[10px] text-text-tertiary truncate">
                {KNOWN_CONTRACTS[contractIndex].description} &middot;{" "}
                {KNOWN_CONTRACTS[contractIndex].address}
              </p>
            )}
          </div>

          {/* Event type + Block range — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[11px] text-text-tertiary mb-2">
                Event
              </p>
              <div className="flex flex-col gap-1.5">
                {EVENT_TYPES.map((e, i) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setEventType(i);
                      resetQuery();
                    }}
                    className={`font-mono text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                      eventType === i
                        ? "bg-text-primary text-surface border-text-primary"
                        : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] text-text-tertiary mb-2">
                Range
              </p>
              <div className="flex flex-col gap-1.5">
                {BLOCK_RANGES.map((r, i) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setBlockRange(i);
                      resetQuery();
                    }}
                    className={`font-mono text-xs px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                      blockRange === i
                        ? "bg-text-primary text-surface border-text-primary"
                        : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live request preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
                Request preview
              </p>
              <span className="font-mono text-[10px] text-text-tertiary">
                rpc.monad.xyz
              </span>
            </div>
            <div className="bg-surface rounded-lg border border-border p-3 overflow-x-auto">
              <pre className="font-mono text-[11px] leading-relaxed text-text-secondary whitespace-pre">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={requestPreview}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {requestPreview}
                  </motion.span>
                </AnimatePresence>
              </pre>
            </div>
          </div>

          {/* Query button */}
          <button
            onClick={runQuery}
            disabled={step === "fetching" || step === "decoding"}
            className={`w-full font-mono text-sm px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
              step === "idle" || step === "done"
                ? "bg-solution-accent text-white hover:bg-solution-accent/90"
                : "bg-solution-accent/50 text-white/60 cursor-default"
            }`}
          >
            {step === "idle" && (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Send query
              </>
            )}
            {step === "fetching" && "Querying rpc.monad.xyz..."}
            {step === "decoding" && `Decoding ${totalCount} events...`}
            {step === "done" && (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Query again
              </>
            )}
          </button>

          {/* Results */}
          {step === "done" && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-secondary">
                {totalCount} events
              </span>
              <span className="font-mono text-[10px] text-solution-accent">
                {latencyMs}ms
              </span>
            </div>
          )}

          {error && (
            <p className="font-mono text-xs text-problem-accent">{error}</p>
          )}

          <AnimatePresence>
            {logs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-x-auto"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="font-mono text-[10px] text-text-tertiary text-left py-2 pr-3">Block</th>
                      <th className="font-mono text-[10px] text-text-tertiary text-left py-2 pr-3">
                        {eventType === 0 ? "From" : "Owner"}
                      </th>
                      <th className="font-mono text-[10px] text-text-tertiary text-left py-2 pr-3">
                        {eventType === 0 ? "To" : "Spender"}
                      </th>
                      <th className="font-mono text-[10px] text-text-tertiary text-right py-2 pr-3">Value</th>
                      <th className="font-mono text-[10px] text-text-tertiary text-left py-2">Contract</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <AnimatePresence key={log.txHash + i}>
                        {i <= revealIndex && (
                          <motion.tr
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className="border-b border-border/50 hover:bg-surface/50"
                          >
                            <td className="font-mono text-[11px] text-text-secondary py-1.5 pr-3 tabular-nums">
                              {log.blockNumber}
                            </td>
                            <td className="font-mono text-[11px] text-text-primary py-1.5 pr-3">
                              {shortenAddr(log.from)}
                            </td>
                            <td className="font-mono text-[11px] text-text-primary py-1.5 pr-3">
                              {shortenAddr(log.to)}
                            </td>
                            <td className="font-mono text-[11px] text-solution-accent py-1.5 pr-3 text-right tabular-nums">
                              {log.value}
                            </td>
                            <td className="font-mono text-[11px] text-text-tertiary py-1.5">
                              {shortenAddr(log.address)}
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    ))}
                  </tbody>
                </table>
                {step === "done" && (
                  <p className="font-mono text-[10px] text-text-tertiary mt-2">
                    {totalCount > 12 && <>Showing 12 of {totalCount} &middot; </>}
                    Values are approximate (assumes 18 or 6 decimals)
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="bg-solution-bg/50 rounded-xl p-4 border border-solution-cell">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[11px] text-solution-accent font-medium">
                Envio on Monad
              </p>
              <span className="font-mono text-[10px] text-solution-muted bg-solution-cell px-1.5 py-0.5 rounded">
                HyperSync + HyperIndex
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong>HyperSync</strong> is Envio&apos;s raw query API &mdash;
              query millions of events in seconds.{" "}
              <strong>HyperIndex</strong> is their hosted indexing framework
              with GraphQL.
              The live demo uses{" "}
              <code className="font-mono text-xs bg-surface px-1 py-0.5 rounded">
                eth_getLogs
              </code>{" "}
              (same data). For production,{" "}
              <a
                href="https://app.envio.dev/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text-primary"
              >
                get a free HyperSync key
              </a>.
            </p>
          </div>
        </div>

        {/* Mobile code toggle */}
        <button
          onClick={() => setShowCode((s) => !s)}
          className="lg:hidden w-full font-mono text-sm px-4 py-2.5 rounded-xl border border-border bg-surface-elevated text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showCode ? "Hide code" : "View code"}
        </button>
        {/* Code panel */}
        <div className={`bg-surface-elevated rounded-2xl border border-border overflow-hidden flex-col ${showCode ? "flex" : "hidden lg:flex"}`}>
          {/* Code tabs */}
          <div className="flex items-center border-b border-border px-4">
            <button
              onClick={() => setCodeTab("hypersync")}
              className={`font-mono text-xs px-3 py-3 border-b-2 transition-all ${
                codeTab === "hypersync"
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              HyperSync
            </button>
            <button
              onClick={() => setCodeTab("hyperindex")}
              className={`font-mono text-xs px-3 py-3 border-b-2 transition-all ${
                codeTab === "hyperindex"
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              HyperIndex
            </button>
            <div className="flex-1" />
            <button
              onClick={() =>
                copy(
                  codeTab === "hypersync"
                    ? getHyperSyncSnippet(evt, activeAddress)
                    : getHyperIndexSnippet(evt, activeAddress),
                  "code"
                )
              }
              aria-label="Copy code snippet"
              className="font-mono text-[11px] text-text-tertiary hover:text-text-primary transition-colors px-2 py-1"
            >
              {copied === "code" ? "Copied!" : "Copy"}
            </button>
            {copyFailed === "code" && (
              <span
                role="status"
                aria-live="polite"
                className="font-mono text-[10px] text-problem-accent"
              >
                Copy failed. Try again.
              </span>
            )}
          </div>

          {/* Code block */}
          <div className="flex-1 overflow-auto p-5 max-h-80 lg:max-h-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${eventType}-${contractIndex}-${customAddress}-${codeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CodeBlock
                  code={codeTab === "hypersync"
                    ? getHyperSyncSnippet(evt, activeAddress)
                    : getHyperIndexSnippet(evt, activeAddress)}
                  language={codeTab === "hypersync" ? "javascript" : "yaml"}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Copy for AI button */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => copy(getAIPrompt(evt, range.value, activeAddress), "ai")}
              className="w-full font-mono text-sm px-4 py-3.5 rounded-xl bg-text-primary text-surface border border-solution-accent/30 hover:border-solution-accent/60 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied === "ai"
                ? "Copied! Paste into your AI assistant"
                : "Copy for AI — HyperSync + HyperIndex + setup"}
            </button>
            {copyFailed === "ai" && (
              <p
                role="status"
                aria-live="polite"
                className="mt-2 font-mono text-[10px] text-problem-accent"
              >
                Copy failed. Try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
