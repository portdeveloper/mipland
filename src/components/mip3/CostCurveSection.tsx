"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

function ethMemoryCost(bytes: number): number {
  const words = Math.ceil(bytes / 32);
  return Math.floor((words * words) / 512) + 3 * words;
}

function mip3MemoryCost(bytes: number): number {
  const words = Math.ceil(bytes / 32);
  return Math.floor(words / 2);
}

const MIN_EXP = 5; // 32 bytes (2^5)
const MAX_EXP = 23; // 8 MB (2^23)
const SLIDER_STEPS = 200;

const THRESHOLDS = [
  { bytes: 2 * 1024, label: "2 KB", subKey: "mip3.costCurve.avgUsage" },
  { bytes: 2 * 1024 * 1024, label: "2 MB", subKey: "mip3.costCurve.historicalMax" },
  { bytes: 3.75 * 1024 * 1024, label: "~3.75 MB", subKey: "mip3.costCurve.ethBlockLimit" },
  { bytes: 8 * 1024 * 1024, label: "8 MB", subKey: "mip3.costCurve.mip3Cap" },
];

function formatBytes(b: number): string {
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(b >= 10_485_760 ? 0 : 1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(b >= 10240 ? 0 : 1)} KB`;
  return `${b} B`;
}

function formatGas(g: number): string {
  if (g >= 1_000_000_000) return `${(g / 1_000_000_000).toFixed(1)}B`;
  if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(g >= 10_000_000 ? 0 : 1)}M`;
  if (g >= 1_000) return `${(g / 1_000).toFixed(g >= 10_000 ? 0 : 1)}K`;
  return `${g}`;
}

export default function CostCurveSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [sliderValue, setSliderValue] = useState(100); // middle-ish

  const currentBytes = useMemo(() => {
    const exp = MIN_EXP + (sliderValue / SLIDER_STEPS) * (MAX_EXP - MIN_EXP);
    return Math.round(Math.pow(2, exp));
  }, [sliderValue]);

  const ethGas = ethMemoryCost(currentBytes);
  const mip3Gas = mip3MemoryCost(currentBytes);
  const ratio = mip3Gas > 0 ? ethGas / mip3Gas : 1;
  const savings = ethGas > 0 ? Math.round(((ethGas - mip3Gas) / ethGas) * 100) : 0;
  const ethImpossible = ethGas > 30_000_000;

  // Build bar chart data points
  const chartPoints = useMemo(() => {
    const points = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const exp = MIN_EXP + (i / steps) * (MAX_EXP - MIN_EXP);
      const bytes = Math.round(Math.pow(2, exp));
      const eth = ethMemoryCost(bytes);
      const mip3 = mip3MemoryCost(bytes);
      points.push({ bytes, eth, mip3 });
    }
    return points;
  }, []);

  // Max for bar scaling (cap at 30M for visual, since ETH goes way beyond)
  const maxGasForChart = 30_000_000;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip3.costCurve.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip3.costCurve.desc")}
        </p>

        {/* Slider */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="memory-size-range" className="font-mono text-xs text-text-tertiary">{t("mip3.costCurve.memorySize")}</label>
            <motion.p
              key={currentBytes}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl font-semibold text-text-primary tabular-nums"
            >
              {formatBytes(currentBytes)}
            </motion.p>
          </div>
          <input
            id="memory-size-range"
            type="range"
            min={0}
            max={SLIDER_STEPS}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            aria-valuetext={`${formatBytes(currentBytes)}, ETH gas: ${ethImpossible ? "exceeds block limit" : formatGas(ethGas)}, MIP-3 gas: ${mip3Gas === 0 ? "free" : formatGas(mip3Gas)}`}
            className="w-full accent-solution-accent cursor-pointer"
          />
          <div className="flex justify-between font-mono text-xs text-text-tertiary mt-1">
            <span>32 B</span>
            <span>8 MB</span>
          </div>

          {/* Threshold markers */}
          <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Memory size presets">
            {THRESHOLDS.map((th) => {
              const isActive = Math.abs(currentBytes - th.bytes) / th.bytes < 0.15;
              return (
                <button
                  key={th.label}
                  onClick={() => {
                    const exp = Math.log2(th.bytes);
                    setSliderValue(
                      Math.round(((exp - MIN_EXP) / (MAX_EXP - MIN_EXP)) * SLIDER_STEPS)
                    );
                  }}
                  aria-pressed={isActive}
                  className={`font-mono text-xs px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface border-border hover:border-text-secondary"
                  }`}
                >
                  {th.label}
                  <span className="text-text-tertiary ml-1.5">{t(th.subKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* ETH gas */}
          <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-5">
            <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-3">
              {t("mip3.costCurve.quadraticEth")}
            </p>
            <motion.p
              key={`eth-${ethGas}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl sm:text-3xl font-semibold text-problem-accent tabular-nums"
            >
              {ethImpossible ? t("mip3.costCurve.impossible") : formatGas(ethGas)}
            </motion.p>
            {!ethImpossible && (
              <p className="font-mono text-xs text-text-tertiary mt-1">{t("mip3.costCurve.gas")}</p>
            )}
            {ethImpossible && (
              <p className="font-mono text-xs text-problem-accent mt-1">
                {t("mip3.costCurve.exceeds")}
              </p>
            )}
          </div>

          {/* MIP-3 gas */}
          <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-5">
            <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-3">
              {t("mip3.costCurve.linearMip3")}
            </p>
            <motion.p
              key={`mip3-${mip3Gas}`}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl sm:text-3xl font-semibold text-solution-accent tabular-nums"
            >
              {mip3Gas === 0 ? "0" : formatGas(mip3Gas)}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary mt-1">
              {mip3Gas === 0 ? `${t("mip3.costCurve.free")} (< 1 word)` : t("mip3.costCurve.gas")}
            </p>
          </div>

          {/* Ratio */}
          <div className="bg-surface-elevated rounded-xl border border-border p-5">
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-3">
              {t("mip3.costCurve.improvement")}
            </p>
            <motion.p
              key={`ratio-${Math.round(ratio)}`}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`font-mono text-2xl sm:text-3xl font-semibold tabular-nums ${
                ratio >= 10 || mip3Gas === 0 ? "text-solution-accent" : "text-text-primary"
              }`}
            >
              {ethImpossible ? "∞" : mip3Gas === 0 ? t("mip3.costCurve.free") : `${ratio.toFixed(ratio >= 100 ? 0 : 1)}x`}
            </motion.p>
            <p className="font-mono text-xs text-text-tertiary mt-1">
              {ethImpossible ? t("mip3.costCurve.onlyMip3") : mip3Gas === 0 ? t("mip3.costCurve.noExpansion") : `${savings}% ${t("mip3.costCurve.cheaper")}`}
            </p>
          </div>
        </div>

        {/* Visual bar comparison */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6">
          <p className="font-mono text-xs text-text-tertiary mb-4">
            {t("mip3.costCurve.gasChart")}
          </p>
          <p className="sr-only">
            Bar chart comparing gas cost as memory grows from 32 bytes to 8 MB. Ethereum&apos;s quadratic cost exceeds the 30M block limit near 4 MB and reaches about {formatGas(ethMemoryCost(8 * 1024 * 1024))} at 8 MB. MIP-3&apos;s linear cost stays at about {formatGas(mip3MemoryCost(8 * 1024 * 1024))} at 8 MB.
          </p>
          <div className="space-y-1.5" aria-hidden="true">
            {chartPoints.map((point, i) => {
              const ethWidth = Math.min(100, (point.eth / maxGasForChart) * 100);
              const mip3Width = Math.min(100, (point.mip3 / maxGasForChart) * 100);
              const ethCapped = point.eth > maxGasForChart;
              const isSelected =
                Math.abs(Math.log2(point.bytes) - Math.log2(currentBytes)) < 0.5;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-50"
                  }`}
                >
                  <span className="font-mono text-xs text-text-tertiary w-14 text-right shrink-0 tabular-nums">
                    {formatBytes(point.bytes)}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="w-full h-2 bg-problem-cell rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ethCapped ? "bg-problem-accent/60" : "bg-problem-accent"
                        }`}
                        style={{ width: `${Math.max(0.5, ethWidth)}%` }}
                      />
                    </div>
                    <div className="w-full h-2 bg-solution-cell rounded-full overflow-hidden">
                      <div
                        className="h-full bg-solution-accent rounded-full"
                        style={{ width: `${Math.max(0.5, mip3Width)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 font-mono text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-full bg-problem-accent inline-block" />
              {t("mip3.costCurve.quadraticLabel")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-full bg-solution-accent inline-block" />
              {t("mip3.costCurve.linearLabel")}
            </span>
            <span className="ml-auto">{t("mip3.costCurve.blockLimit")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
