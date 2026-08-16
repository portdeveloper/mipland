"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const COLS = 16;
const TOTAL = COLS * 8;

const PAGES = [
  { label: "page 0x7a2f...", slot: 17 },
  { label: "page 0x3e81...", slot: 94 },
  { label: "page 0xb4c5...", slot: 42 },
  { label: "page 0x91d7...", slot: 109 },
];

const FIELD_NAMES = ["owner", "balance", "timestamp", "approved"];
const COLD_COST = 8100;
const WARM_COST = 100;

export default function ComparisonSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [loadedSlots, setLoadedSlots] = useState<number[]>([]);
  const [pageWarmed, setPageWarmed] = useState(false);

  const currentGas = loadedSlots.length * COLD_COST;
  const mip8Gas = loadedSlots.length === 0
    ? 0
    : COLD_COST + (loadedSlots.length - 1) * WARM_COST;

  const handleLoad = (fieldIndex: number) => {
    if (loadedSlots.includes(fieldIndex)) return;
    setLoadedSlots((prev) => [...prev, fieldIndex]);
    if (!pageWarmed) setPageWarmed(true);
  };

  const reset = () => {
    setLoadedSlots([]);
    setPageWarmed(false);
  };

  const allLoaded = loadedSlots.length === 4;
  const savings = currentGas > 0
    ? Math.round(((currentGas - mip8Gas) / currentGas) * 100)
    : 0;
  const loadedFieldNames = loadedSlots.map((i) => FIELD_NAMES[i]).join(", ");
  const comparisonSummary =
    loadedSlots.length === 0
      ? "No fields loaded yet. Load fields to compare current Monad cold reads with MIP-8 page warming."
      : `${loadedSlots.length} field${loadedSlots.length === 1 ? "" : "s"} loaded: ${loadedFieldNames}. Current Monad gas is ${currentGas.toLocaleString()}; MIP-8 gas is ${mip8Gas.toLocaleString()}.`;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip8.comparison.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip8.comparison.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-8">
          {t("mip8.comparison.clickNote")}
        </p>

        {/* Struct + buttons */}
        <div className="space-y-4 mb-6">
          <div className="bg-surface-elevated rounded-lg border border-border px-4 py-3 font-mono text-sm inline-block">
            <span className="text-text-tertiary">struct Token {"{"}</span>
            {FIELD_NAMES.map((name, i) => (
              <span key={name}>
                {" "}
                <span
                  className={
                    loadedSlots.includes(i)
                      ? "text-text-primary font-semibold"
                      : "text-text-tertiary"
                  }
                >
                  {name}
                </span>
                {i < 3 ? "," : ""}
              </span>
            ))}
            <span className="text-text-tertiary"> {"}"}</span>
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Storage field load controls"
            aria-describedby="comparison-status"
          >
            {FIELD_NAMES.map((name, i) => (
              <button
                key={name}
                onClick={() => handleLoad(i)}
                type="button"
                aria-pressed={loadedSlots.includes(i)}
                aria-label={`${loadedSlots.includes(i) ? "Loaded" : "Load"} ${name} field`}
                className={`font-mono text-xs px-3 py-2 rounded-md border transition-all ${
                  loadedSlots.includes(i)
                    ? "bg-text-primary text-surface border-text-primary cursor-default"
                    : "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
                }`}
              >
                SLOAD {name}
              </button>
            ))}
            <button
              onClick={reset}
              type="button"
              disabled={loadedSlots.length === 0}
              aria-label="Reset loaded fields"
              className={`font-mono text-xs px-3 py-2 transition-colors cursor-pointer ${
                loadedSlots.length > 0
                  ? "text-text-tertiary hover:text-text-primary"
                  : "text-transparent pointer-events-none"
              }`}
            >
              {t("mip8.comparison.reset")}
            </button>
          </div>
          <p id="comparison-status" className="sr-only" aria-live="polite">
            {comparisonSummary}
          </p>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left: Monad (current) (problem) */}
          <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs text-problem-muted uppercase tracking-wider">
                {t("mip8.comparison.monadCurrent")}
              </p>
              <p className="font-mono text-xs text-problem-muted">
                {loadedSlots.length} {loadedSlots.length !== 1 ? t("mip8.comparison.coldReads") : t("mip8.comparison.coldRead")}
              </p>
            </div>

            {/* 4 mini page grids */}
            <div
              className="grid grid-cols-2 gap-2 mb-4"
              role="img"
              aria-label={`Current Monad layout. ${loadedSlots.length} of 4 fields loaded across separate pages for ${currentGas.toLocaleString()} gas.`}
            >
              {PAGES.map((page, pageIndex) => {
                const isLoaded = loadedSlots.includes(pageIndex);
                return (
                  <div
                    key={page.label}
                    className={`rounded-md p-2 border transition-all duration-300 ${
                      isLoaded
                        ? "border-problem-accent bg-problem-bg"
                        : "border-problem-cell bg-problem-bg/50"
                    }`}
                  >
                    <p className="font-mono text-xs text-text-tertiary mb-1">
                      {page.label}
                    </p>
                    <div
                      className="grid gap-[1px]"
                      style={{
                        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: TOTAL }, (_, i) => {
                        const isTarget = i === page.slot;
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-[1px] transition-colors duration-300 ${
                              isTarget && isLoaded
                                ? "bg-problem-accent"
                                : "bg-problem-cell"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gas */}
            <div className="flex items-center justify-between pt-3 border-t border-problem-cell-hover">
              <p className="font-mono text-xs text-text-tertiary">
                {loadedSlots.length} x 8,100
              </p>
              <motion.p
                key={`current-${currentGas}`}
                initial={{ scale: currentGas > 0 ? 1.15 : 1 }}
                animate={{ scale: 1 }}
                className="font-mono text-2xl font-semibold text-problem-accent tabular-nums"
              >
                {currentGas.toLocaleString()}
              </motion.p>
            </div>
          </div>

          {/* Right: MIP-8 (solution) */}
          <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs text-solution-muted uppercase tracking-wider">
                MIP-8
              </p>
              <p className="font-mono text-xs text-solution-muted">
                {loadedSlots.length > 0 ? `1 ${t("mip8.comparison.cold")}` : "0"}{loadedSlots.length > 1 ? ` + ${loadedSlots.length - 1} ${t("mip8.comparison.warm")}` : ""}
              </p>
            </div>

            {/* Single page grid */}
            <div
              className={`rounded-md p-2 border-2 border-dashed transition-all duration-500 mb-4 ${
                pageWarmed ? "border-solution-accent" : "border-solution-cell"
              }`}
              role="img"
              aria-label={`MIP-8 layout. ${loadedSlots.length} of 4 contiguous fields loaded on one page for ${mip8Gas.toLocaleString()} gas. ${pageWarmed ? "The page is warm after the first access." : "No page has been warmed yet."}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-xs text-text-tertiary">
                  {t("mip8.comparison.contiguous")}
                </p>
                {pageWarmed && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="font-mono text-xs px-1.5 py-0.5 rounded-full bg-solution-accent text-white"
                  >
                    {t("mip8.comparison.warm").toUpperCase()}
                  </motion.span>
                )}
              </div>
              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: TOTAL }, (_, i) => {
                  const isField = i < 4;
                  const fieldLoaded = isField && loadedSlots.includes(i);

                  return (
                    <motion.div
                      key={i}
                      className="aspect-square rounded-[1px]"
                      animate={{
                        backgroundColor: fieldLoaded
                          ? "#2a7d6a"
                          : isField && pageWarmed
                          ? "#c8e6df"
                          : pageWarmed
                          ? "rgba(200, 230, 223, 0.5)"
                          : "#d4e8e2",
                      }}
                      transition={{
                        delay: pageWarmed && !fieldLoaded ? i * 0.002 : 0,
                        duration: 0.3,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Spacer to align with the 4-grid layout above */}
            <div className="flex-1" />

            {/* Gas */}
            <div className="flex items-center justify-between pt-3 border-t border-solution-accent-light">
              <p className="font-mono text-xs text-text-tertiary">
                {loadedSlots.length > 0
                  ? `8,100 + ${Math.max(0, loadedSlots.length - 1)} x 100`
                  : "0"}
              </p>
              <motion.p
                key={`mip8-${mip8Gas}`}
                initial={{ scale: mip8Gas > 0 ? 1.15 : 1 }}
                animate={{ scale: 1 }}
                className="font-mono text-2xl font-semibold text-solution-accent tabular-nums"
              >
                {mip8Gas.toLocaleString()}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Savings bar */}
        <AnimatePresence>
          {allLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-elevated rounded-lg border border-border p-4"
              role="img"
              aria-label={`Four fields loaded. MIP-8 costs ${mip8Gas.toLocaleString()} gas versus ${currentGas.toLocaleString()} gas on current Monad, ${savings}% cheaper with MIP-8.`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-xs text-text-tertiary">
                  {t("mip8.comparison.fourFields")}
                </p>
                <p className="font-mono text-lg font-semibold text-solution-accent">
                  {savings}{t("mip8.comparison.cheaperWithMip8")}
                </p>
              </div>
              <div className="w-full h-3 bg-problem-cell rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(mip8Gas / currentGas) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-solution-accent rounded-full"
                />
              </div>
              <div className="flex justify-between mt-1 font-mono text-xs text-text-tertiary">
                <span>MIP-8: {mip8Gas.toLocaleString()}</span>
                <span>Monad: {currentGas.toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
