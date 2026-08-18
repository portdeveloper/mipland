"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const COLD_COST = 8100;
const WARM_COST = 100;

function currentGas(n: number) {
  return n * COLD_COST;
}

function mip8Gas(n: number) {
  if (n === 0) return 0;
  return COLD_COST + (n - 1) * WARM_COST;
}

function ratio(n: number) {
  if (n <= 1) return 1;
  return currentGas(n) / mip8Gas(n);
}

export default function CherryPickedSection() {
  const { ref, isVisible } = useInView(0.1);
  const { t } = useLanguage();
  const [batchSize, setBatchSize] = useState(20);

  const current = currentGas(batchSize);
  const mip8 = mip8Gas(batchSize);
  const improvement = ratio(batchSize);
  const savings = Math.round(((current - mip8) / current) * 100);
  const batchSummary = `${batchSize} tokens use ${current.toLocaleString()} gas in the standard layout and ${mip8.toLocaleString()} gas in the page-aware layout, saving ${savings}% gas.`;

  return (
    <section ref={ref} className="py-24 px-6 bg-solution-bg relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
          {t("cherryPicked.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("cherryPicked.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          {t("cherryPicked.subDesc")}
        </p>

        {/* Before / After layout comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {/* Standard layout */}
          <div className="bg-surface-elevated rounded-xl border border-border p-5">
            <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-4">
              {t("cherryPicked.standardLayout")}
            </p>
            <div className="font-mono text-sm mb-4">
              <p className="text-text-tertiary text-xs mb-2">
                {t("cherryPicked.standardComment")}
              </p>
              <p>
                <span className="text-problem-accent">mapping</span>(uint256 =&gt;{" "}
              </p>
              <p className="ml-4">
                <span className="text-problem-accent">mapping</span>(address =&gt;
                uint256))
              </p>
              <p className="ml-8 text-text-tertiary">balances;</p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-problem-accent" />
              <p className="font-mono text-xs text-text-tertiary">
                {t("cherryPicked.standardNote")}
              </p>
            </div>
            {/* Scattered page visualization */}
            <div
              className="grid grid-cols-4 gap-2"
              role="img"
              aria-label={`Standard mapping layout scatters ${batchSize} token reads across separate pages. All ${batchSize} reads are cold for ${current.toLocaleString()} gas.`}
            >
              {Array.from({ length: 4 }, (_, pageIdx) => (
                <div key={pageIdx} className="bg-problem-bg rounded-md p-2">
                  <p className="font-mono text-xs text-text-tertiary mb-1">
                    page {pageIdx === 0 ? "0x7a.." : pageIdx === 1 ? "0x3e.." : pageIdx === 2 ? "0xb4.." : "0x91.."}
                  </p>
                  <div className="grid grid-cols-4 gap-[1px]">
                    {Array.from({ length: 16 }, (_, i) => {
                      const isTarget = i === (pageIdx * 3 + 5) % 16;
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-[1px] ${
                            isTarget ? "bg-problem-accent" : "bg-problem-cell"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="font-mono text-xs text-problem-accent mt-3">
              {batchSize} {t("cherryPicked.tokens")} = {batchSize} cold reads = {current.toLocaleString()} gas
            </p>
          </div>

          {/* Page-aware layout */}
          <div className="bg-surface-elevated rounded-xl border border-solution-accent-light p-5">
            <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-4">
              {t("cherryPicked.pageAwareLayout")}
            </p>
            <div className="font-mono text-sm mb-4">
              <p className="text-text-tertiary text-xs mb-2">
                {t("cherryPicked.pageAwareComment")}
              </p>
              <p>
                <span className="text-solution-accent">uint256</span>[128] balances;
              </p>
              <p className="text-text-tertiary text-xs mt-1">
                {t("cherryPicked.pageAwareMapComment")}
              </p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-solution-accent" />
              <p className="font-mono text-xs text-text-tertiary">
                {t("cherryPicked.pageAwareNote")}
              </p>
            </div>
            {/* Single page visualization */}
            <div
              className="bg-solution-bg rounded-md p-2"
              role="img"
              aria-label={`Page-aware layout keeps ${batchSize} token reads on one page. The first read is cold and ${batchSize - 1} reads are warm for ${mip8.toLocaleString()} gas.`}
            >
              <p className="font-mono text-xs text-text-tertiary mb-1">
                page 0
              </p>
              <div className="grid grid-cols-16 gap-[1px]" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                {Array.from({ length: 64 }, (_, i) => {
                  const isAccessed = i < batchSize;
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-[1px] ${
                        isAccessed
                          ? i === 0
                            ? "bg-solution-accent"
                            : "bg-solution-accent-light"
                          : "bg-solution-cell"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
            <p className="font-mono text-xs text-solution-accent mt-3">
              {batchSize} {t("cherryPicked.tokens")} = 1 cold + {batchSize - 1} warm = {mip8.toLocaleString()} gas
            </p>
          </div>
        </div>

        {/* Batch size slider */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label
                htmlFor="batch-size-range"
                className="font-mono text-xs text-text-tertiary uppercase tracking-wider"
              >
                {t("cherryPicked.batchSize")}
              </label>
              <p className="text-sm text-text-secondary font-light mt-1">
                {t("cherryPicked.batchDesc")}
              </p>
            </div>
            <div className="text-right">
              <motion.p
                key={batchSize}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-mono text-3xl font-semibold text-text-primary tabular-nums"
              >
                {batchSize}
              </motion.p>
              <p className="font-mono text-xs text-text-tertiary">{t("cherryPicked.tokens")}</p>
            </div>
          </div>
          <input
            id="batch-size-range"
            type="range"
            min={2}
            max={64}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            aria-valuetext={batchSummary}
            aria-describedby="batch-size-summary"
            className="w-full accent-solution-accent cursor-pointer"
          />
          <div className="flex justify-between font-mono text-xs text-text-tertiary mt-1">
            <span>2</span>
            <span>{t("cherryPicked.threshold")}</span>
            <span>64</span>
          </div>
          <p id="batch-size-summary" className="sr-only" aria-live="polite">
            {batchSummary}
          </p>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Current gas */}
          <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-5">
            <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-3">
              {t("cherryPicked.standardLabel")}
            </p>
            <motion.p
              key={`current-${batchSize}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl sm:text-3xl font-semibold text-problem-accent tabular-nums"
            >
              {current.toLocaleString()}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary mt-1">gas</p>
            <p className="font-mono text-xs text-text-tertiary mt-2">
              {batchSize} x 8,100 ({t("cherryPicked.allCold")})
            </p>
          </div>

          {/* MIP-8 gas */}
          <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-5">
            <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-3">
              {t("cherryPicked.pageAwareLabel")}
            </p>
            <motion.p
              key={`mip8-${batchSize}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl sm:text-3xl font-semibold text-solution-accent tabular-nums"
            >
              {mip8.toLocaleString()}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary mt-1">gas</p>
            <p className="font-mono text-xs text-text-tertiary mt-2">
              8,100 + {batchSize - 1} x 100
            </p>
          </div>

          {/* Improvement ratio */}
          <div className="bg-surface-elevated rounded-xl border border-border p-5">
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-3">
              {t("cherryPicked.improvement")}
            </p>
            <motion.p
              key={`ratio-${batchSize}`}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className={`font-mono text-2xl sm:text-3xl font-semibold tabular-nums ${
                improvement >= 10 ? "text-solution-accent" : "text-text-primary"
              }`}
            >
              {improvement.toFixed(1)}x
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary mt-1">{t("cherryPicked.cheaper")}</p>
            <p className="font-mono text-xs text-text-tertiary mt-2">
              {savings}% {t("cherryPicked.gasSaved")}
            </p>
          </div>
        </div>

        {/* Savings bar */}
        <div
          className="bg-surface-elevated rounded-lg border border-border p-4"
          role="img"
          aria-label={`Gas comparison bar. ${batchSummary}`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono text-xs text-text-tertiary">
              {t("cherryPicked.gasComparison")}
            </p>
            <motion.p
              key={`savings-${batchSize}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`font-mono text-lg font-semibold ${
                improvement >= 10 ? "text-solution-accent" : "text-text-primary"
              }`}
            >
              {improvement >= 10 ? `${improvement.toFixed(1)}x ${t("cherryPicked.cheaper")}` : `${savings}% ${t("cherryPicked.cheaper")}`}
            </motion.p>
          </div>
          <div className="w-full h-3 bg-problem-cell rounded-full overflow-hidden">
            <motion.div
              key={`bar-${batchSize}`}
              initial={{ width: 0 }}
              animate={{ width: `${(mip8 / current) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-solution-accent rounded-full"
            />
          </div>
          <div className="flex justify-between mt-1 font-mono text-xs text-text-tertiary">
            <span>{t("cherryPicked.pageAwareLabel")}: {mip8.toLocaleString()}</span>
            <span>{t("cherryPicked.standardLabel")}: {current.toLocaleString()}</span>
          </div>
          <p className="font-mono text-xs text-text-tertiary mt-3">
            {t("cherryPicked.explanation")}
          </p>
        </div>
      </div>
    </section>
  );
}
