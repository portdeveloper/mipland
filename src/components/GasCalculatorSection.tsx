"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

interface Scenario {
  name: string;
  description: string;
  currentGas: number | null;
  mip8Gas: number | null;
  currentBreakdown: string;
  mip8Breakdown: string;
  currentLabel?: string;
  mip8Label?: string;
  note?: string;
}

const SCENARIO_DATA = [
  {
    nameKey: "mip8.gasCalc.scenario1Name",
    descKey: "mip8.gasCalc.scenario1Desc",
    currentGas: 32400,
    mip8Gas: 8400,
    currentBreakdown: "4 × 8,100 (distinct cold slots on Monad)",
    mip8Breakdown: "1 × 8,100 (first page touch) + 3 × 100 (warm reads in same page)",
  },
  {
    nameKey: "mip8.gasCalc.scenario2Name",
    descKey: "mip8.gasCalc.scenario2Desc",
    currentGas: 64800,
    mip8Gas: 8800,
    currentBreakdown: "8 × 8,100 (distinct cold slots on Monad)",
    mip8Breakdown: "1 × 8,100 (first page touch) + 7 × 100 (warm reads in same page)",
  },
  {
    nameKey: "mip8.gasCalc.scenario3Name",
    descKey: "mip8.gasCalc.scenario3Desc",
    currentGas: 64800,
    mip8Gas: 64800,
    currentBreakdown: "8 × 8,100 (distinct cold slots)",
    mip8Breakdown: "8 × 8,100 (typically 8 different pages)",
  },
  {
    nameKey: "mip8.gasCalc.scenario4Name",
    descKey: "mip8.gasCalc.scenario4Desc",
    currentGas: 24300,
    mip8Gas: 24300,
    currentBreakdown: "3 × 8,100 (distinct cold slots)",
    mip8Breakdown: "3 × 8,100 (usually 3 different pages)",
  },
];

export default function GasCalculatorSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const scenarios: Scenario[] = useMemo(() => SCENARIO_DATA.map((s) => ({
    name: t(s.nameKey),
    description: t(s.descKey),
    currentGas: s.currentGas,
    mip8Gas: s.mip8Gas,
    currentBreakdown: s.currentBreakdown,
    mip8Breakdown: s.mip8Breakdown,
  })), [t]);

  const scenario = scenarios[selectedIdx];
  const currentGas = scenario.currentGas;
  const mip8Gas = scenario.mip8Gas;

  const hasComparableNumbers = currentGas !== null && mip8Gas !== null;
  const savings = hasComparableNumbers
    ? Math.round(((currentGas - mip8Gas) / currentGas) * 100)
    : null;
  const currentDisplay =
    currentGas !== null
      ? currentGas.toLocaleString()
      : scenario.currentLabel ?? "variable";
  const mip8Display =
    mip8Gas !== null
      ? mip8Gas.toLocaleString()
      : scenario.mip8Label ?? "variable";
  const savingsSummary =
    savings !== null
      ? `${scenario.name}: current Monad uses ${currentDisplay} gas and MIP-8 uses ${mip8Display} gas. ${
          savings > 0 ? `MIP-8 is ${savings}% cheaper.` : "There is no MIP-8 gas change."
        }`
      : `${scenario.name}: gas comparison is variable because the specification is still open.`;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface relative">

      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip8.gasCalc.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-2xl leading-relaxed mb-2">
          {t("mip8.gasCalc.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-2xl leading-relaxed mb-10">
          {t("mip8.gasCalc.note")}
        </p>

        {/* Scenario picker */}
        <div
          className="flex flex-wrap gap-2 mb-8"
          role="group"
          aria-label="Gas scenario picker"
        >
          {scenarios.map((s, i) => (
            <button
              key={s.name}
              onClick={() => setSelectedIdx(i)}
              type="button"
              aria-pressed={i === selectedIdx}
              className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
                i === selectedIdx
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface-elevated border-border hover:border-text-secondary"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-6 font-light">
          {scenario.description}
        </p>

        {/* Side by side comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Monad (current) */}
          <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-6">
            <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-4">
              {t("mip8.gasCalc.monadCurrent")}
            </p>
            <motion.p
              key={`current-${selectedIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-4xl font-semibold text-problem-accent tabular-nums mb-2"
            >
              {currentDisplay}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary">{t("mip8.gasCalc.gas")}</p>
            <div className="mt-4 pt-4 border-t border-problem-cell-hover">
              <p className="font-mono text-xs text-text-secondary">
                {scenario.currentBreakdown}
              </p>
            </div>
          </div>

          {/* MIP-8 */}
          <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-6">
            <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-4">
              MIP-8
            </p>
            <motion.p
              key={`mip8-${selectedIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono text-4xl font-semibold text-solution-accent tabular-nums mb-2"
            >
              {mip8Display}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary">{t("mip8.gasCalc.gas")}</p>
            <div className="mt-4 pt-4 border-t border-solution-accent-light">
              <p className="font-mono text-xs text-text-secondary">
                {scenario.mip8Breakdown}
              </p>
            </div>
          </div>
        </div>

        {/* Savings bar */}
        <div
          className="bg-surface-elevated rounded-lg border border-border p-4"
          role="img"
          aria-label={`Gas savings comparison. ${savingsSummary}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs text-text-tertiary">{t("mip8.gasCalc.gasSavings")}</p>
            {savings !== null ? (
              <motion.p
                key={savings}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className={`font-mono text-lg font-semibold ${
                  savings > 0 ? "text-solution-accent" : "text-text-tertiary"
                }`}
              >
                {savings > 0 ? `${savings}% ${t("mip8.gasCalc.cheaper")}` : t("mip8.gasCalc.noChange")}
              </motion.p>
            ) : (
              <p className="font-mono text-sm font-semibold text-text-tertiary">
                {t("mip8.gasCalc.specOpen")}
              </p>
            )}
          </div>
          {savings !== null ? (
            <>
              <div className="w-full h-3 bg-problem-cell rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${savings}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-solution-accent rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1 font-mono text-xs text-text-tertiary">
                <span>{t("mip8.gasCalc.saved")}</span>
                <span>{t("mip8.gasCalc.monadCurrent")}</span>
              </div>
            </>
          ) : (
            <p className="font-mono text-xs text-text-tertiary">
              {t("mip8.gasCalc.specNote")}
            </p>
          )}
          {scenario.note && (
            <p className="font-mono text-xs text-text-tertiary mt-3">
              {scenario.note}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
