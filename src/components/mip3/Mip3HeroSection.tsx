"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

// Quadratic: words²/512 + 3*words
function ethMemoryCost(bytes: number): number {
  const words = Math.ceil(bytes / 32);
  return Math.floor((words * words) / 512) + 3 * words;
}

// Linear: words / 2
function mip3MemoryCost(bytes: number): number {
  const words = Math.ceil(bytes / 32);
  return Math.floor(words / 2);
}

const TARGET_BYTES = 1_048_576; // 1 MB
const STEPS = 40;
const STEP_DELAY = 80;

export default function Mip3HeroSection() {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRunning(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const innerTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!running) return;
    if (step >= STEPS) return;
    const timer = setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next >= STEPS) {
          setRunning(false);
          innerTimerRef.current = setTimeout(() => {
            setStep(0);
            innerTimerRef.current = setTimeout(() => setRunning(true), 500);
          }, 3000);
        }
        return next;
      });
    }, STEP_DELAY);
    return () => {
      clearTimeout(timer);
      clearTimeout(innerTimerRef.current);
    };
  }, [step, running]);

  // Exponential scale so early steps show small sizes, later steps show big
  const currentBytes = Math.round(
    32 * Math.pow(TARGET_BYTES / 32, step / STEPS)
  );
  const ethGas = ethMemoryCost(currentBytes);
  const mip3Gas = mip3MemoryCost(currentBytes);
  const ratio = mip3Gas > 0 ? (ethGas / mip3Gas).toFixed(1) : "1.0";

  const formatBytes = (b: number) => {
    if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
    if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${b} B`;
  };

  const formatGas = (g: number) => {
    if (g >= 1_000_000) return `${(g / 1_000_000).toFixed(1)}M`;
    if (g >= 1_000) return `${(g / 1_000).toFixed(1)}K`;
    return `${g}`;
  };

  return (
    <section className="min-h-[75vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl relative z-10 mt-30"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-6">
          {t("mip3.hero.title1")}{" "}
          <span className="font-semibold italic">{t("mip3.hero.titleHighlight")}</span>
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip3.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>

      {/* Animated counter comparison */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-16 mb-16 relative z-10 w-full max-w-2xl"
      >
        <div className="bg-surface-elevated rounded-xl p-6 shadow-sm border border-border">
          {/* Memory size indicator */}
          <div className="flex items-center justify-between mb-5">
            <p className="font-mono text-xs text-text-tertiary">
              {t("mip3.hero.allocating")}
            </p>
            <p className="font-mono text-sm font-semibold text-text-primary tabular-nums">
              {formatBytes(currentBytes)}
            </p>
          </div>

          {/* Two bars */}
          <div className="space-y-4">
            {/* Quadratic */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-mono text-xs text-problem-accent">
                  {t("mip3.hero.quadratic")}
                </p>
                <p className="font-mono text-xs text-problem-accent font-semibold tabular-nums">
                  {formatGas(ethGas)} gas
                </p>
              </div>
              <div className="w-full h-4 bg-problem-cell rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-problem-accent rounded-full"
                  animate={{
                    width: `${Math.min(100, (ethGas / ethMemoryCost(TARGET_BYTES)) * 100)}%`,
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            </div>

            {/* Linear */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-mono text-xs text-solution-accent">
                  {t("mip3.hero.linear")}
                </p>
                <p className="font-mono text-xs text-solution-accent font-semibold tabular-nums">
                  {formatGas(mip3Gas)} gas
                </p>
              </div>
              <div className="w-full h-4 bg-solution-cell rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-solution-accent rounded-full"
                  animate={{
                    width: `${Math.max(mip3Gas > 0 ? 1.5 : 0, Math.min(100, (mip3Gas / mip3MemoryCost(TARGET_BYTES)) * 100))}%`,
                  }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            </div>
          </div>

          {/* Ratio */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="font-mono text-xs text-text-tertiary">
              {step >= STEPS
                ? t("mip3.hero.memoryOf")
                : `${t("mip3.hero.expanding")} ${formatBytes(currentBytes)}...`}
            </p>
            {Number(ratio) > 1.5 && (
              <motion.p
                key={ratio}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="font-mono text-sm font-semibold text-solution-accent tabular-nums"
              >
                {ratio}{t("mip3.hero.cheaper")}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
