"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useExplainMode } from "./ExplainModeContext";

interface TxCardProps {
  label: string;
  detail: string;
  color: string;
  bg: string;
}

function TxCard({ label, detail, color, bg }: TxCardProps) {
  return (
    <div
      className="flex-shrink-0 rounded-lg px-3 py-2 min-w-[120px] sm:min-w-[140px]"
      style={{ backgroundColor: bg }}
    >
      <p className="font-mono text-[11px] font-semibold" style={{ color }}>
        {label}
      </p>
      <p className="text-[11px] text-text-secondary">{detail}</p>
    </div>
  );
}

export default function WhatIsMevSection() {
  const { mode } = useExplainMode();

  return (
    <AnimatePresence mode="sync">
      {mode === "simple" && (
        <motion.section
          key="what-is-mev"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="py-24 px-6 bg-surface relative">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
                First, what is MEV?
              </h2>
              <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-10">
                MEV stands for Maximal Extractable Value. It is the profit
                someone can make by choosing which transactions go in a block
                and in what order.
              </p>

              {/* Visual example */}
              <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-8">
                <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-5">
                  Example: a bot front-runs Alice
                </p>

                {/* Original order */}
                <div className="mb-6">
                  <p className="font-mono text-[11px] text-text-tertiary mb-2">
                    What Alice submitted:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <TxCard
                      label="Alice"
                      detail="Buy 10 ETH"
                      color="#3b7dd8"
                      bg="#edf3fc"
                    />
                    <span className="font-mono text-text-tertiary text-xs select-none">&rarr;</span>
                    <TxCard
                      label="Bob"
                      detail="Send USDC"
                      color="#6b9dd4"
                      bg="#edf3fc"
                    />
                    <span className="font-mono text-text-tertiary text-xs select-none">&rarr;</span>
                    <TxCard
                      label="Carol"
                      detail="Swap tokens"
                      color="#6b9dd4"
                      bg="#edf3fc"
                    />
                  </div>
                </div>

                {/* Reordered */}
                <div>
                  <p className="font-mono text-[11px] text-problem-accent mb-2">
                    What actually executes:
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <TxCard
                      label="Bot"
                      detail="Buy ETH first"
                      color="#c4653a"
                      bg="#fdf6ef"
                    />
                    <span className="font-mono text-text-tertiary text-xs select-none">&rarr;</span>
                    <TxCard
                      label="Alice"
                      detail="Buy ETH (higher price)"
                      color="#3b7dd8"
                      bg="#edf3fc"
                    />
                    <span className="font-mono text-text-tertiary text-xs select-none">&rarr;</span>
                    <TxCard
                      label="Bot"
                      detail="Sell ETH for profit"
                      color="#2a7d6a"
                      bg="#f0f7f5"
                    />
                    <span className="font-mono text-text-tertiary text-xs select-none">&rarr;</span>
                    <TxCard
                      label="Bob"
                      detail="Send USDC"
                      color="#6b9dd4"
                      bg="#edf3fc"
                    />
                  </div>
                  <p className="font-mono text-[11px] text-text-tertiary mt-3">
                    The bot bought first, pushed the price up, then sold at a profit.
                    Alice paid more than she needed to.
                  </p>
                </div>
              </div>

              {/* Bridge to spam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-user-bg rounded-xl border border-user-cell p-5">
                  <p className="font-mono text-xs text-user-muted uppercase tracking-wider mb-2">
                    Ethereum L1
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Bots compete in private, off-chain auctions. Only the winning
                    trade makes it on-chain. Failed attempts never clog the
                    blockchain.
                  </p>
                </div>
                <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-5">
                  <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-2">
                    Fast, cheap chains
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Blocks come too fast for private auctions. So bots take a
                    different approach: they flood the chain with speculative
                    probes, hoping one lands on a profitable opportunity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
