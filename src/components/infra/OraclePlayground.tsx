"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import OnChainCall from "./OnChainCall";
import CodeBlock from "./CodeBlock";
import { useCopyToClipboard } from "./useCopyToClipboard";

/* ─── Types ──────────────────────────────────────────────────────────── */

interface Token {
  symbol: string;
  name: string;
  redstoneAddress: string;
}

interface PricePoint {
  price: number;
  timestamp: number;
}

/* ─── Tokens with real Monad mainnet RedStone addresses ──────────────── */

const TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    redstoneAddress: "0xc44be6D00307c3565FDf753e852Fc003036cBc13",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    redstoneAddress: "0xED2B1ca5D7E246f615c2291De309643D41FeC97e",
  },
  {
    symbol: "MON",
    name: "Monad",
    redstoneAddress: "0x1C9582E87eD6E99bc23EC0e6Eb52eE9d7C0D6bcd",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    redstoneAddress: "0x7A9b672fc20b5C89D6774514052b3e0899E5E263",
  },
];

/* ─── Providers (all from Monad docs, only RedStone active) ──────────── */

const PROVIDERS = [
  { id: "redstone", name: "RedStone", ready: true },
  { id: "pyth", name: "Pyth", ready: false },
  { id: "chainlink", name: "Chainlink", ready: false },
  { id: "supra", name: "Supra", ready: false },
  { id: "stork", name: "Stork", ready: false },
  { id: "switchboard", name: "Switchboard", ready: false },
  { id: "chronicle", name: "Chronicle", ready: false },
  { id: "eoracle", name: "eOracle", ready: false },
];

/* ─── Mini sparkline ─────────────────────────────────────────────────── */

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const step = w / (points.length - 1);

  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h * 0.8 - h * 0.1;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />
    </svg>
  );
}

/* ─── Code snippets (verified against Monad docs) ────────────────────── */

function getJSSnippet(token: Token): string {
  return `import { createPublicClient, http, parseAbi } from "viem";

// RedStone on Monad uses Chainlink-compatible interface
const abi = parseAbi([
  "function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)",
  "function decimals() view returns (uint8)",
]);

const client = createPublicClient({
  chain: { id: 10143, name: "Monad", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } } },
  transport: http(),
});

// RedStone ${token.symbol}/USD on Monad
const address = "${token.redstoneAddress}";

const [roundData, decimals] = await Promise.all([
  client.readContract({ address, abi, functionName: "latestRoundData" }),
  client.readContract({ address, abi, functionName: "decimals" }),
]);

const [, answer, , updatedAt] = roundData;
const price = Number(answer) / 10 ** decimals;
console.log(\`${token.symbol}/USD: $\${price}\`);
console.log(\`Updated: \${new Date(Number(updatedAt) * 1000)}\`);`;
}

function getSolSnippet(token: Token): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// RedStone on Monad is Chainlink-compatible — use AggregatorV3Interface
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract RedStonePriceFeed {
    // ${token.symbol}/USD on Monad mainnet
    AggregatorV3Interface internal priceFeed =
        AggregatorV3Interface(${token.redstoneAddress});

    /**
     * Returns the latest ${token.symbol}/USD price.
     * RedStone pushes updates on-chain (0.5% deviation, 6h heartbeat).
     * Just read the contract — no off-chain data injection needed.
     */
    function get${token.symbol}Price() public view returns (int256) {
        (
            /* uint80 roundId */,
            int256 price,
            /* uint startedAt */,
            /* uint updatedAt */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return price; // 8 decimals
    }
}`;
}

function getAIPrompt(token: Token): string {
  return `I want to read ${token.symbol}/USD price from RedStone oracle on Monad.

## Key fact
RedStone on Monad deploys Chainlink-compatible price feed contracts.
You read them with the standard AggregatorV3Interface — no special SDK needed.

## Contract addresses (Monad mainnet, chain ID 10143)
- ETH/USD: 0xc44be6D00307c3565FDf753e852Fc003036cBc13
- BTC/USD: 0xED2B1ca5D7E246f615c2291De309643D41FeC97e
- MON/USD: 0x1C9582E87eD6E99bc23EC0e6Eb52eE9d7C0D6bcd
- USDC/USD: 0x7A9b672fc20b5C89D6774514052b3e0899E5E263
- USDT/USD: 0x90196F6D52fce394C79D1614265d36D3F0033Ccf
- stETH/USD: 0xD3A0C347b07Fd45F41270D557089B389Fa735C3d

Full list: https://github.com/monad-crypto/protocols/blob/main/mainnet/redstone.jsonc

## Setup
1. Install: npm install viem (frontend) or @chainlink/contracts (Solidity)
2. RPC: https://rpc.monad.xyz
3. Chain ID: 10143

## Solidity
${getSolSnippet(token)}

## Frontend (viem)
${getJSSnippet(token)}

## Details
- Push model: prices are already on-chain, updated by RedStone network
- Update conditions: 0.5% deviation OR 6-hour heartbeat
- 8 decimal places
- Uses standard Chainlink AggregatorV3Interface
- Docs: https://docs.redstone.finance/
- Live feeds: https://app.redstone.finance/app/feeds/?networks=10143

Integrate this into my project following my existing code patterns.`;
}

/* ─── Main component ─────────────────────────────────────────────────── */

export default function OraclePlayground() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [providerId, setProviderId] = useState("redstone");
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const { copied, copy } = useCopyToClipboard();
  const [codeTab, setCodeTab] = useState<"js" | "sol">("js");
  const [showCode, setShowCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestPriceRef = useRef<number | null>(null);

  const token = TOKENS[selectedToken];

  // Fetch real prices from RedStone API
  useEffect(() => {
    let cancelled = false;
    const symbol = TOKENS[selectedToken].symbol;

    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `https://api.redstone.finance/prices?symbol=${symbol}&provider=redstone&limit=1`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const price = data[0]?.value;
        if (price == null || cancelled) return;

        latestPriceRef.current = price;
        setPrices((prev) => {
          const next = [...prev, { price, timestamp: Date.now() }];
          return next.slice(-30);
        });
        setError(null);
      } catch {
        if (!cancelled) setError("Could not reach RedStone API");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedToken]);

  const handleSelectToken = (i: number) => {
    if (i !== selectedToken) {
      setSelectedToken(i);
      setLoading(true);
      setError(null);
      setPrices([]);
      latestPriceRef.current = null;
    }
  };

  const currentPrice =
    prices.length > 0 ? prices[prices.length - 1].price : 0;
  const prevPrice =
    prices.length > 1 ? prices[prices.length - 2].price : currentPrice;
  const delta = currentPrice - prevPrice;
  const deltaColor = delta >= 0 ? "#2a7d6a" : "#c4653a";

  return (
    <div className="space-y-6">
      {/* Provider tabs */}
      <div>
        <p className="font-mono text-[11px] text-text-tertiary mb-3">
          Pick a provider
        </p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => p.ready && setProviderId(p.id)}
              disabled={!p.ready}
              className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                providerId === p.id
                  ? "bg-solution-accent text-white border-solution-accent"
                  : p.ready
                  ? "bg-surface-elevated text-text-secondary border-border hover:border-text-tertiary"
                  : "text-text-tertiary/30 border-border/40 cursor-default"
              }`}
            >
              {p.name}
              {!p.ready && (
                <span className="ml-1.5 text-[10px] opacity-50">soon</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Interactive playground ──────────────────────────────── */}
        <div className="bg-surface-elevated rounded-2xl border border-border p-6 space-y-6">
          {/* Token picker */}
          <div>
            <p className="font-mono text-[11px] text-text-tertiary mb-3">
              Pick a token
            </p>
            <div className="flex flex-wrap gap-2">
              {TOKENS.map((t, i) => (
                <button
                  key={t.symbol}
                  onClick={() => handleSelectToken(i)}
                  className={`font-mono text-sm px-3 py-2 rounded-lg border transition-all ${
                    selectedToken === i
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
                  }`}
                >
                  {t.symbol}
                  <span className="text-text-tertiary ml-1 text-[11px]">
                    /USD
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Price display */}
          <div>
            {loading ? (
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-semibold text-text-tertiary/30">
                  Loading&hellip;
                </span>
              </div>
            ) : error ? (
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-lg text-problem-accent">{error}</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-3 mb-1">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentPrice.toFixed(4)}
                      initial={{ opacity: 0.4, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-4xl font-semibold tabular-nums tracking-tight"
                    >
                      $
                      {currentPrice < 10
                        ? currentPrice.toFixed(4)
                        : currentPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </motion.span>
                  </AnimatePresence>
                  {prices.length > 1 && (
                    <motion.span
                      key={delta > 0 ? "up" : "down"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-mono text-sm tabular-nums"
                      style={{ color: deltaColor }}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(4)}
                    </motion.span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-text-tertiary">
                  {token.symbol}/USD &middot; live from{" "}
                  <a
                    href="https://api.redstone.finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-text-secondary"
                  >
                    api.redstone.finance
                  </a>{" "}
                  &middot; refreshes every 10s
                </p>
              </>
            )}
          </div>

          {/* Sparkline */}
          {prices.length > 1 && (
            <Sparkline points={prices.map((p) => p.price)} color={deltaColor} />
          )}

          {/* Provider info */}
          <div className="bg-solution-bg/50 rounded-xl p-4 border border-solution-cell">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-mono text-[11px] text-solution-accent font-medium">
                RedStone on Monad
              </p>
              <span className="font-mono text-[10px] text-solution-muted bg-solution-cell px-1.5 py-0.5 rounded">
                Push oracle
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              RedStone deploys <strong>Chainlink-compatible</strong> price feed
              contracts on Monad. Prices are pushed on-chain (0.5% deviation or
              6h heartbeat). Just call{" "}
              <code className="font-mono text-xs bg-surface px-1 py-0.5 rounded">
                latestRoundData()
              </code>{" "}
              &mdash; no special SDK needed.
            </p>
          </div>

          {/* Contract address */}
          <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border">
            <span className="font-mono text-[11px] text-text-tertiary shrink-0">
              {token.symbol}/USD
            </span>
            <code className="font-mono text-[11px] text-text-primary truncate flex-1">
              {token.redstoneAddress}
            </code>
            <button
              onClick={() =>
                copy(token.redstoneAddress, "address")
              }
              aria-label="Copy contract address"
              className="font-mono text-[10px] text-text-tertiary hover:text-text-primary transition-colors shrink-0"
            >
              {copied === "address" ? "Copied!" : "Copy"}
            </button>
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
              onClick={() => setCodeTab("js")}
              className={`font-mono text-xs px-3 py-3 border-b-2 transition-all ${
                codeTab === "js"
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              viem
            </button>
            <button
              onClick={() => setCodeTab("sol")}
              className={`font-mono text-xs px-3 py-3 border-b-2 transition-all ${
                codeTab === "sol"
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            >
              Solidity
            </button>
            <div className="flex-1" />
            <button
              onClick={() =>
                copy(
                  codeTab === "js"
                    ? getJSSnippet(token)
                    : getSolSnippet(token),
                  "code"
                )
              }
              aria-label="Copy code snippet"
              className="font-mono text-[11px] text-text-tertiary hover:text-text-primary transition-colors px-2 py-1"
            >
              {copied === "code" ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Code block */}
          <div className="flex-1 overflow-auto p-5 max-h-80 lg:max-h-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedToken}-${codeTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CodeBlock
                  code={codeTab === "js" ? getJSSnippet(token) : getSolSnippet(token)}
                  language={codeTab === "js" ? "javascript" : "sol"}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Copy for AI button */}
          <div className="border-t border-border p-4">
            <button
              onClick={() => copy(getAIPrompt(token), "ai")}
              className="w-full font-mono text-sm px-4 py-3.5 rounded-xl bg-text-primary text-surface border border-solution-accent/30 hover:border-solution-accent/60 shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied === "ai"
                ? "Copied! Paste into your AI assistant"
                : "Copy for AI — RedStone + all addresses + setup"}
            </button>
          </div>
        </div>
      </div>

      {/* ── On-chain call demo ───────────────────────────────────────── */}
      <OnChainCall symbol={token.symbol} address={token.redstoneAddress} />
    </div>
  );
}
