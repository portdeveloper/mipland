"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

export default function CollisionSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [stepIdx, setStepIdx] = useState(0);

  const STEPS = [
    {
      id: "monad-claims",
      label: t("mip7.collision.step1Label"),
      monad: { byte: "0xAB", name: "FAST_HASH", status: "claimed" },
      ethereum: { byte: "0xAB", name: "(unassigned)", status: "free" },
      message: t("mip7.collision.step1Message"),
    },
    {
      id: "eth-claims",
      label: t("mip7.collision.step2Label"),
      monad: { byte: "0xAB", name: "FAST_HASH", status: "claimed" },
      ethereum: { byte: "0xAB", name: "SWAP17", status: "claimed" },
      message: t("mip7.collision.step2Message"),
    },
    {
      id: "divergence",
      label: t("mip7.collision.step3Label"),
      monad: { byte: "0xAB", name: "FAST_HASH", status: "conflict" },
      ethereum: { byte: "0xAB", name: "SWAP17", status: "conflict" },
      message: t("mip7.collision.step3Message"),
    },
  ];

  const step = STEPS[stepIdx];

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip7.collision.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip7.collision.desc")}
        </p>

        {/* Step buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStepIdx(i)}
              className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
                i === stepIdx
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface-elevated border-border hover:border-text-secondary"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        {/* Chain comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Monad */}
          <div
            className={`rounded-xl border p-6 transition-all duration-300 ${
              step.monad.status === "conflict"
                ? "bg-problem-bg border-problem-cell-hover"
                : "bg-surface-elevated border-border"
            }`}
          >
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
              Monad
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`font-mono text-2xl font-semibold tabular-nums px-3 py-1.5 rounded-lg ${
                  step.monad.status === "claimed" || step.monad.status === "conflict"
                    ? "bg-solution-accent text-white"
                    : "bg-border text-text-tertiary"
                }`}
              >
                {step.monad.byte}
              </div>
              <div>
                <p
                  className={`font-mono text-sm font-semibold ${
                    step.monad.status === "claimed" || step.monad.status === "conflict"
                      ? "text-solution-accent"
                      : "text-text-tertiary"
                  }`}
                >
                  {step.monad.name}
                </p>
                <p className="font-mono text-xs text-text-tertiary mt-0.5">
                  {step.monad.status === "free"
                    ? t("mip7.collision.notAssigned")
                    : step.monad.status === "claimed"
                    ? t("mip7.collision.assignedByMonad")
                    : t("mip7.collision.assignedByMonad")}
                </p>
              </div>
            </div>
            {(step.monad.status === "claimed" || step.monad.status === "conflict") && (
              <div className="font-mono text-xs bg-surface rounded-lg p-3 border border-border">
                <span className="text-text-tertiary">{"// executes "}</span>
                <span className="text-solution-accent">Monad FAST_HASH</span>
              </div>
            )}
          </div>

          {/* Ethereum */}
          <div
            className={`rounded-xl border p-6 transition-all duration-300 ${
              step.ethereum.status === "conflict"
                ? "bg-problem-bg border-problem-cell-hover"
                : "bg-surface-elevated border-border"
            }`}
          >
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
              Ethereum
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`font-mono text-2xl font-semibold tabular-nums px-3 py-1.5 rounded-lg ${
                  step.ethereum.status === "claimed"
                    ? "bg-problem-accent text-white"
                    : step.ethereum.status === "conflict"
                    ? "bg-problem-accent text-white"
                    : "bg-border text-text-tertiary"
                }`}
              >
                {step.ethereum.byte}
              </div>
              <div>
                <p
                  className={`font-mono text-sm font-semibold ${
                    step.ethereum.status === "claimed" || step.ethereum.status === "conflict"
                      ? "text-problem-accent"
                      : "text-text-tertiary"
                  }`}
                >
                  {step.ethereum.name}
                </p>
                <p className="font-mono text-xs text-text-tertiary mt-0.5">
                  {step.ethereum.status === "free"
                    ? t("mip7.collision.notAssigned")
                    : t("mip7.collision.assignedByEth")}
                </p>
              </div>
            </div>
            {step.ethereum.status === "claimed" || step.ethereum.status === "conflict" ? (
              <div className="font-mono text-xs bg-surface rounded-lg p-3 border border-border">
                <span className="text-text-tertiary">{"// executes "}</span>
                <span className="text-problem-accent">Ethereum SWAP17</span>
              </div>
            ) : (
              <div className="font-mono text-xs bg-surface rounded-lg p-3 border border-border text-text-tertiary">
                {"// 0xAB → INVALID"}
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className={`rounded-lg border p-4 ${
              step.monad.status === "conflict"
                ? "bg-problem-bg border-problem-cell-hover"
                : "bg-surface-elevated border-border"
            }`}
          >
            <p
              className={`font-mono text-sm ${
                step.monad.status === "conflict"
                  ? "text-problem-accent"
                  : "text-text-secondary"
              }`}
            >
              {step.message}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* The fix callout */}
        {stepIdx === STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 rounded-xl bg-solution-bg border border-solution-accent-light p-5"
          >
            <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-2">
              {t("mip7.collision.mip7Solution")}
            </p>
            <p className="font-mono text-sm text-solution-accent">
              {t("mip7.collision.mip7SolutionDesc")}
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
