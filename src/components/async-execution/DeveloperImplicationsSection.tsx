"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useInView } from "@/components/useInView";

const SCENARIOS = [
  {
    id: "funded",
    label: "newly funded account",
    title: "A zero-balance account needs a short delay",
    body: "Consensus validates gas budgets using a 3-block delayed view. If account B had zero MON and account A just funded it, B's transaction should wait until that funding transfer is old enough to appear in the delayed state.",
    stat: "~1.2s",
    statLabel: "typical wait after inclusion",
  },
  {
    id: "simulate",
    label: "eth_call / estimateGas",
    title: "Simulation can use speculative state",
    body: "A node may execute a proposed block before it finalizes. That lets eth_call and eth_estimateGas answer against a state that is likely more current, while the canonical state root still follows the delayed-root pipeline.",
    stat: "fast",
    statLabel: "feedback without finality",
  },
  {
    id: "combine",
    label: "atomic workaround",
    title: "Funding and spending can be combined",
    body: "If the intended flow allows it, account A can call a contract that both funds and performs B's desired action atomically. That avoids a separate wait between the funding transfer and the follow-up action.",
    stat: "1 tx",
    statLabel: "when the app can compose it",
  },
];

export default function DeveloperImplicationsSection() {
  const { ref, isVisible } = useInView(0.1);
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const active = SCENARIOS.find((scenario) => scenario.id === activeId) ?? SCENARIOS[0];

  return (
    <section
      id="developer-effects"
      ref={ref}
      className="py-24 px-6 bg-surface relative scroll-mt-16"
    >
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="max-w-3xl mb-10">
          <p className="font-mono text-xs text-text-tertiary uppercase mb-3">
            developer effects
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold mb-4">
            Most apps just need to know the edges
          </h2>
          <p className="text-lg text-text-secondary font-light leading-relaxed">
            Asynchronous execution preserves EVM transaction semantics, but the
            delayed state view leaks into a few app-level workflows around
            funding, simulation, and low-balance accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
          <div className="bg-surface-elevated rounded-2xl border border-border p-2 h-fit">
            {SCENARIOS.map((scenario) => {
              const activeScenario = scenario.id === activeId;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveId(scenario.id)}
                  aria-pressed={activeScenario}
                  className={`w-full text-left rounded-xl px-4 py-3 min-h-11 transition-all ${
                    activeScenario
                      ? "bg-text-primary text-surface"
                      : "text-text-secondary hover:bg-surface"
                  }`}
                >
                  <p className="font-mono text-xs">{scenario.label}</p>
                </button>
              );
            })}
          </div>

          <div className="bg-surface-elevated rounded-2xl border border-border p-6 sm:p-7">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_150px] gap-6">
              <div>
                <p className="font-mono text-xs text-text-tertiary uppercase mb-3">
                  selected edge case
                </p>
                <h3 className="text-2xl font-semibold mb-3">
                  {active.title}
                </h3>
                <p className="text-base text-text-secondary font-light leading-relaxed">
                  {active.body}
                </p>
              </div>
              <div className="rounded-xl bg-solution-bg border border-solution-accent-light p-5 flex flex-col justify-center">
                <motion.p
                  key={active.stat}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="font-mono text-3xl font-semibold text-solution-accent tabular-nums"
                >
                  {active.stat}
                </motion.p>
                <p className="font-mono text-[10px] text-solution-muted leading-snug mt-2">
                  {active.statLabel}
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-solution-cell">
                  <motion.div
                    key={`${active.id}-bar`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full origin-left rounded-full bg-solution-accent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-problem-bg border border-problem-cell-hover p-5">
                <p className="font-mono text-xs text-problem-muted uppercase mb-2">
                  watch for
                </p>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  Account flows that assume a just-funded zero-balance account
                  can immediately pay for another transaction.
                </p>
              </div>
              <div className="rounded-xl bg-solution-bg border border-solution-accent-light p-5">
                <p className="font-mono text-xs text-solution-muted uppercase mb-2">
                  use this mental model
                </p>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  Consensus is ahead, execution catches up, and delayed roots
                  prove the pipeline stayed aligned.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/mip-4"
                className="inline-flex items-center justify-center min-h-11 rounded-md bg-text-primary px-4 py-2 font-mono text-xs text-surface hover:bg-text-secondary transition-colors"
              >
                Reserve balance explainer
              </Link>
              <a
                href="https://docs.monad.xyz/monad-arch/consensus/asynchronous-execution"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-11 rounded-md border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:text-text-primary hover:border-text-tertiary/50 transition-colors"
              >
                Read Monad docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
