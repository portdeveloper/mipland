"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useInView } from "@/components/useInView";
import { colors } from "@/lib/colors";

const TRANSACTIONS = [
  {
    id: "tx 01",
    action: "B sends A 10 MON",
    read: "B balance",
    write: "A balance +10",
    outcome: "succeeds",
  },
  {
    id: "tx 02",
    action: "A sends C 8 MON",
    read: "A balance",
    write: "C balance +8",
    outcome: "depends on tx 01",
  },
  {
    id: "tx 03",
    action: "D swaps on AMM",
    read: "pool reserves",
    write: "new reserves",
    outcome: "succeeds or reverts deterministically",
  },
];

export default function DeterminismSection() {
  const { ref, isVisible } = useInView(0.1);
  const [selected, setSelected] = useState(1);

  const selectedTx = TRANSACTIONS[selected];
  const dependencies = useMemo(
    () =>
      TRANSACTIONS.map((tx, index) => ({
        ...tx,
        status:
          index < selected
            ? "already ordered"
            : index === selected
              ? "currently executing"
              : "ordered later",
      })),
    [selected],
  );

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="max-w-3xl mb-10">
          <p className="font-mono text-xs text-text-tertiary uppercase mb-3">
            deterministic state
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
            Once ordering is fixed, the truth is fixed
          </h2>
          <p className="text-lg text-text-secondary font-light leading-relaxed">
            Execution can lag consensus without changing semantics because a
            Monad block is still an ordered list of transactions. Every node
            executes that list and commits results in the same order.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-5">
          <div className="bg-surface-elevated rounded-2xl border border-border p-5 sm:p-6">
            <p className="font-mono text-xs text-text-tertiary uppercase mb-4">
              canonical transaction order
            </p>
            <div className="space-y-2">
              {dependencies.map((tx, index) => {
                const active = index === selected;
                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelected(index)}
                    aria-pressed={active}
                    className={`w-full text-left rounded-xl border p-4 transition-all min-h-11 ${
                      active
                        ? "bg-solution-bg border-solution-accent-light"
                        : "bg-surface border-border hover:border-text-tertiary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-text-tertiary mb-1">
                          {tx.id}
                        </p>
                        <p className="text-sm text-text-primary">{tx.action}</p>
                      </div>
                      <span
                        className={`font-mono text-[10px] mt-0.5 ${
                          active ? "text-solution-accent" : "text-text-tertiary"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-elevated rounded-2xl border border-border p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <p className="font-mono text-xs text-text-tertiary uppercase">
                execution view
              </p>
              <p className="font-mono text-[10px] text-text-tertiary">
                selected: {selectedTx.id}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <StateCard label="reads" value={selectedTx.read} tone="neutral" />
              <StateCard label="writes" value={selectedTx.write} tone="solution" />
              <StateCard label="outcome" value={selectedTx.outcome} tone="problem" />
            </div>

            <div className="rounded-xl bg-surface border border-border p-4 overflow-hidden">
              <div className="relative h-[170px]">
                <div className="absolute left-6 top-5 bottom-5 w-px bg-border" />
                <motion.div
                  key={selectedTx.id}
                  aria-hidden
                  initial={{ top: 18, opacity: 0, scale: 0.8 }}
                  animate={{
                    top: [18, 76, 134],
                    opacity: [0, 1, 1],
                    scale: [0.8, 1, 1],
                  }}
                  transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-[19px] z-10 h-3.5 w-3.5 rounded-full bg-solution-accent shadow-[0_0_0_5px_rgba(42,125,106,0.13)]"
                />
                {["ordered", "executed", "merged"].map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -12 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.45,
                      delay: 0.15 + index * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute left-0 right-0 flex items-center gap-4"
                    style={{ top: `${index * 58}px` }}
                  >
                    <span
                      className="w-12 h-12 rounded-full border border-border bg-surface-elevated flex items-center justify-center font-mono text-xs font-semibold"
                      style={{
                        color:
                          index === 0
                            ? colors.userAccent
                            : index === 1
                              ? colors.problemAccentStrong
                              : colors.solutionAccent,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-mono text-xs text-text-primary">
                        {step}
                      </p>
                      <p className="text-sm text-text-secondary font-light">
                        {timelineCopy[index]}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const timelineCopy = [
  "Consensus fixes the sequence.",
  "Local EVM work can run later.",
  "Results commit in original order.",
];

function StateCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "solution" | "problem";
}) {
  const className =
    tone === "solution"
      ? "bg-solution-bg border-solution-accent-light text-solution-accent"
      : tone === "problem"
        ? "bg-problem-bg border-problem-cell-hover text-problem-accent-strong"
        : "bg-surface border-border text-text-tertiary";

  return (
    <div className={`rounded-xl border p-4 ${className}`}>
      <p className="font-mono text-[10px] uppercase mb-2">
        {label}
      </p>
      <p className="text-sm text-text-primary leading-snug">{value}</p>
    </div>
  );
}
