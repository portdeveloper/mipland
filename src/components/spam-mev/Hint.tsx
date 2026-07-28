"use client";

import { useState } from "react";
import { useExplainMode } from "./ExplainModeContext";

interface HintProps {
  term: string;
  children?: React.ReactNode;
}

const HINTS_TECHNICAL: Record<string, string> = {
  mev: "Maximal Extractable Value - profit from reordering, inserting, or censoring transactions in a block.",
  gas: "A unit measuring computational work on a blockchain. Every transaction consumes gas.",
  mempool: "A waiting area where pending transactions sit before being included in a block.",
  "block gas": "The total computational capacity available in a single block.",
  "clearing price": "The gas price at which total demand exactly fills the block. Everyone included pays at least this much.",
  b_max: "The maximum gas capacity of a block. A design parameter that blockchain teams can adjust.",
  b_plat: "The plateau threshold - the block size beyond which adding more capacity no longer changes the equilibrium.",
  pfo: "Priority Fee Ordering - sorting transactions by how much they bid, so higher-paying transactions go first.",
  "user welfare": "The aggregate benefit users get from their transactions minus the fees they pay.",
  "spam share": "The fraction of total included block gas consumed by spam transactions.",
  gmin: "A protocol-enforced floor on the gas price per transaction, regardless of how empty the block is.",
  searcher: "A bot that monitors blockchains for profitable MEV opportunities and submits transactions to capture them.",
  dex: "Decentralized Exchange - a protocol that lets users swap tokens directly on-chain without an intermediary.",
  sequencer: "The entity responsible for ordering and batching transactions on a rollup before posting them to L1.",
};

const HINTS_SIMPLE: Record<string, string> = {
  mev: "Money that bots make by cutting in line with their transactions.",
  gas: "The fee you pay to use the blockchain. Like postage for a letter.",
  mempool: "A public queue where transactions wait before being processed. Bots can peek at it to plan their moves.",
  "block gas": "How much stuff fits in one block. Think of it like seats on a bus.",
  "clearing price": "The fee everyone in the block ends up paying. More demand means higher fees.",
  b_max: "How big the block is. Bigger blocks fit more transactions, but also more spam.",
  b_plat: "The block size where making it even bigger stops helping. Spam has already maxed out.",
  pfo: "Instead of first-come-first-served, transactions are sorted by who pays the most. This pushes spam to the back.",
  "user welfare": "How much value real users get out of their transactions, after paying fees.",
  "spam share": "What percentage of the block is wasted on spam bot transactions.",
  gmin: "The lowest possible fee. Nobody can send a transaction for less than this amount.",
  searcher: "A bot that watches for ways to profit from other people's transactions.",
  dex: "A place to trade tokens directly on the blockchain, with no middleman.",
  sequencer: "The computer that decides which transactions go in each block and in what order.",
};

export default function Hint({ term, children }: HintProps) {
  const [open, setOpen] = useState(false);
  const { mode } = useExplainMode();
  const hints = mode === "simple" ? HINTS_SIMPLE : HINTS_TECHNICAL;
  const description = hints[term.toLowerCase()];
  if (!description) return <>{children ?? term}</>;

  return (
    <span className="relative inline">
      {children ?? term}
      {/* Hover-only definition badge. Hidden from the accessibility tree:
          Hint renders inside labels and buttons, so a focusable badge would
          nest interactive controls and pollute their accessible names. */}
      <span
        aria-hidden="true"
        className="absolute -top-1.5 -right-3.5 inline-flex items-center justify-center w-3 h-3 rounded-full bg-border text-text-tertiary text-[8px] font-mono font-semibold leading-none cursor-help"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onTouchStart={() => setOpen((o) => !o)}
      >
        ?
        {open && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-text-primary text-surface text-xs font-sans font-normal leading-relaxed w-56 text-center shadow-lg z-50 pointer-events-none">
            {description}
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text-primary" />
          </span>
        )}
      </span>
    </span>
  );
}
