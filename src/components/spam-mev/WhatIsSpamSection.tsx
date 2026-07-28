"use client";

import { useInView } from "../useInView";
import { useExplainMode } from "./ExplainModeContext";
import Hint from "./Hint";

interface FlowStep {
  label: string;
  color: string;
  bg: string;
}

function FlowDiagram({
  steps,
  result,
  resultColor,
}: {
  steps: FlowStep[];
  result: string;
  resultColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center gap-2 w-full">
          <div
            className="px-4 py-2.5 rounded-lg text-center w-full font-mono text-xs"
            style={{ backgroundColor: step.bg, color: step.color }}
          >
            {step.label}
          </div>
          {i < steps.length - 1 && (
            <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
              <path
                d="M6 0 L6 12 M2 8 L6 12 L10 8"
                fill="none"
                stroke="#9b9084"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ))}
      <div
        className="mt-1 font-mono text-xs font-semibold"
        style={{ color: resultColor }}
      >
        {result}
      </div>
    </div>
  );
}

export default function WhatIsSpamSection() {
  const { ref, isVisible } = useInView(0.1);
  const { mode } = useExplainMode();
  const simple = mode === "simple";

  const targetedSteps: FlowStep[] = simple
    ? [
        { label: "Bot watches for opportunities", bg: "#d4e4f4", color: "#3b7dd8" },
        { label: "Calculates the perfect trade", bg: "#d4e4f4", color: "#3b7dd8" },
        { label: "Sends one transaction", bg: "#b8d4f0", color: "#2a5da8" },
        { label: "Trade executes on-chain", bg: "#d4e4f4", color: "#3b7dd8" },
      ]
    : [
        { label: "Searcher monitors mempool", bg: "#d4e4f4", color: "#3b7dd8" },
        { label: "Off-chain computation", bg: "#d4e4f4", color: "#3b7dd8" },
        { label: "1 precise transaction", bg: "#b8d4f0", color: "#2a5da8" },
        { label: "On-chain execution", bg: "#d4e4f4", color: "#3b7dd8" },
      ];

  const spamSteps: FlowStep[] = simple
    ? [
        { label: "Bot sends hundreds of transactions", bg: "#f0d0c0", color: "#c4653a" },
        { label: "All of them run on the blockchain", bg: "#f0d0c0", color: "#c4653a" },
        { label: "Each one asks: is there money here?", bg: "#e8b8a8", color: "#a04828" },
        { label: "Most find nothing and fail", bg: "#f0d0c0", color: "#c4653a" },
      ]
    : [
        { label: "Searcher floods chain with probes", bg: "#f0d0c0", color: "#c4653a" },
        { label: "All probes run on-chain", bg: "#f0d0c0", color: "#c4653a" },
        { label: "Each checks: opportunity exists?", bg: "#e8b8a8", color: "#a04828" },
        { label: "Most revert or find nothing", bg: "#f0d0c0", color: "#c4653a" },
      ];

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {simple ? "How it works" : "Two kinds of MEV extraction"}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-12">
          {simple
            ? "There are two ways to extract MEV. The traditional way is precise and efficient. The spam way is messy and wasteful."
            : "Traditional MEV identifies opportunities off-chain and submits precise transactions. Spam MEV floods the chain with speculative probes whose profitability is resolved only at execution time."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Targeted MEV */}
          <div className="bg-user-bg rounded-xl border border-user-cell p-6">
            <p className="font-mono text-xs text-user-muted uppercase tracking-wider mb-1">
              {simple ? "The precise way" : "Targeted MEV"}
            </p>
            <p className="text-sm text-text-secondary mb-6">
              {simple
                ? "One careful trade. Almost always profitable."
                : "Precise, computed off-chain. One transaction."}
            </p>
            <FlowDiagram
              steps={targetedSteps}
              result={simple ? "Almost always profitable" : "High success rate"}
              resultColor="#3b7dd8"
            />
            <p className="font-mono text-[11px] text-text-tertiary mt-4 text-center">
              {simple
                ? "Failed attempts never reach the blockchain"
                : "Losing bids filtered out before execution"}
            </p>
          </div>

          {/* Spam MEV */}
          <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-6">
            <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-1">
              {simple ? "The spam way" : "Spam MEV"}
            </p>
            <p className="text-sm text-text-secondary mb-6">
              {simple
                ? "Hundreds of guesses. Only ~1 in 10 works."
                : "Speculative, resolved on-chain. Many probes."}
            </p>
            <FlowDiagram
              steps={spamSteps}
              result={simple ? "Only ~1 in 10 finds anything" : "6-12% success rate"}
              resultColor="#c4653a"
            />
            <p className="font-mono text-[11px] text-text-tertiary mt-4 text-center">
              {simple
                ? "But all of them take up space in the block"
                : "Failed probes still consume block gas"}
            </p>
          </div>
        </div>

        {/* Three conditions */}
        <div className="mt-12 bg-surface-elevated rounded-xl border border-border p-6">
          <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
            {simple
              ? "Why does this happen?"
              : "Three conditions that enable spam MEV"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-mono text-2xl mb-1">$0.001</p>
              <p className="text-sm text-text-secondary font-light">
                {simple
                  ? "Each failed attempt costs almost nothing"
                  : "Low transaction fees make failed probes cheap"}
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl mb-1">&lt;1s</p>
              <p className="text-sm text-text-secondary font-light">
                {simple
                  ? "Blocks come so fast there's no time to think"
                  : "Fast block times leave no time for targeted extraction"}
              </p>
            </div>
            <div className="text-center">
              <p className="font-mono text-2xl mb-1">No <Hint term="mempool">mempool</Hint></p>
              <p className="text-sm text-text-secondary font-light">
                {simple
                  ? "Bots can't see other transactions before they execute"
                  : "Without a mempool, targeted extraction is harder"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
