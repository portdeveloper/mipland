"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const TOTAL_MB = 8;

interface CallFrame {
  name: string;
  allocMB: number;
  color: string;
}

const DEMO_FRAMES: CallFrame[][] = [
  [],
  [{ name: "Contract A", allocMB: 1, color: "bg-problem-accent" }],
  [
    { name: "Contract A", allocMB: 1, color: "bg-problem-accent" },
    { name: "Contract B", allocMB: 3, color: "bg-solution-accent" },
  ],
  [
    { name: "Contract A", allocMB: 1, color: "bg-problem-accent" },
    { name: "Contract B", allocMB: 3, color: "bg-solution-accent" },
    { name: "Contract C", allocMB: 2, color: "bg-text-secondary" },
  ],
  [
    { name: "Contract A", allocMB: 1, color: "bg-problem-accent" },
    { name: "Contract B", allocMB: 3, color: "bg-solution-accent" },
  ],
  [{ name: "Contract A", allocMB: 1, color: "bg-problem-accent" }],
  [
    { name: "Contract A", allocMB: 1, color: "bg-problem-accent" },
    { name: "Contract D", allocMB: 4, color: "bg-solution-muted" },
  ],
];

const STEP_KEYS = [
  "mip3.memoryPool.step1",
  "mip3.memoryPool.step2",
  "mip3.memoryPool.step3",
  "mip3.memoryPool.step4",
  "mip3.memoryPool.step5",
  "mip3.memoryPool.step6",
  "mip3.memoryPool.step7",
];

export default function MemoryPoolSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps = useMemo(() =>
    STEP_KEYS.map((key, i) => ({
      action: t(key),
      frames: DEMO_FRAMES[i],
    })),
    [t]
  );

  const step = demoSteps[stepIdx];
  const usedMB = step.frames.reduce((sum, f) => sum + f.allocMB, 0);
  const freeMB = TOTAL_MB - usedMB;
  const finished = stepIdx >= demoSteps.length - 1;

  const handleNext = useCallback(() => {
    if (stepIdx < demoSteps.length - 1) {
      setStepIdx((s) => s + 1);
    }
  }, [stepIdx, demoSteps.length]);

  const handlePrev = useCallback(() => {
    if (stepIdx > 0) {
      setStepIdx((s) => s - 1);
    }
  }, [stepIdx]);

  const handlePlay = useCallback(() => {
    setStepIdx(0);
    setIsPlaying(true);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isPlaying) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, isPlaying]);

  // Auto-advance when playing using a timer
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIdx >= demoSteps.length - 1) return;
    const timer = setTimeout(() => {
      setStepIdx((s) => {
        if (s + 1 >= demoSteps.length - 1) {
          setIsPlaying(false);
        }
        return s + 1;
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [isPlaying, stepIdx, demoSteps.length]);

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-elevated relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip3.memoryPool.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip3.memoryPool.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip3.memoryPool.subDesc")}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Pool bar visualization */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                {t("mip3.memoryPool.transactionPool")}
              </p>
              <p className="font-mono text-xs text-text-tertiary">
                {freeMB} {t("mip3.memoryPool.free")}
              </p>
            </div>

            {/* The pool bar */}
            <div className="w-full h-16 bg-border/30 rounded-lg overflow-hidden flex">
              <AnimatePresence mode="popLayout">
                {step.frames.map((frame) => (
                  <motion.div
                    key={frame.name}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: `${(frame.allocMB / TOTAL_MB) * 100}%`,
                      opacity: 1,
                    }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`${frame.color} h-full flex items-center justify-center`}
                  >
                    <p className="font-mono text-xs text-white font-semibold truncate px-2">
                      {frame.name} ({frame.allocMB} MB)
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Scale */}
            <div className="flex justify-between mt-2 font-mono text-xs text-text-tertiary">
              <span>0 MB</span>
              <span>4 MB</span>
              <span>8 MB</span>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-problem-accent tabular-nums">
                  {usedMB}
                </p>
                <p className="font-mono text-xs text-text-tertiary">{t("mip3.memoryPool.mbUsed")}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-solution-accent tabular-nums">
                  {freeMB}
                </p>
                <p className="font-mono text-xs text-text-tertiary">{t("mip3.memoryPool.mbFree")}</p>
              </div>
              <div className="text-center">
                <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">
                  {step.frames.length}
                </p>
                <p className="font-mono text-xs text-text-tertiary">
                  {step.frames.length !== 1 ? t("mip3.memoryPool.calls") : t("mip3.memoryPool.call")} {t("mip3.memoryPool.callsDeep")}
                </p>
              </div>
            </div>
          </div>

          {/* Call stack + action log */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
              {t("mip3.memoryPool.callStack")}
            </p>
            <div className="space-y-2 mb-6 min-h-[120px]">
              <AnimatePresence>
                {step.frames.map((frame, i) => (
                  <motion.div
                    key={frame.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3"
                    style={{ paddingLeft: `${i * 16}px` }}
                  >
                    <div className={`w-3 h-3 rounded-sm ${frame.color}`} />
                    <p className="font-mono text-sm text-text-primary">
                      {frame.name}
                    </p>
                    <p className="font-mono text-xs text-text-tertiary">
                      {frame.allocMB} MB
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {step.frames.length === 0 && (
                <p className="font-mono text-xs text-text-tertiary italic">
                  {t("mip3.memoryPool.noActiveCalls")}
                </p>
              )}
            </div>

            {/* Action */}
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 bg-surface-elevated rounded-lg border border-border"
              >
                <p className="font-mono text-xs text-solution-accent">
                  {step.action}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={stepIdx <= 0 || isPlaying}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
              stepIdx <= 0 || isPlaying
                ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
                : "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
            }`}
          >
            {t("mip3.memoryPool.prev")}
          </button>
          <button
            onClick={handleNext}
            disabled={finished || isPlaying}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
              finished || isPlaying
                ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
                : "bg-solution-accent text-white border-solution-accent hover:bg-solution-accent/90 cursor-pointer"
            }`}
          >
            {stepIdx === 0 ? t("mip3.memoryPool.start") : t("mip3.memoryPool.next")}
          </button>
          <button
            onClick={handlePlay}
            disabled={isPlaying}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
              isPlaying
                ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
                : "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
            }`}
          >
            {isPlaying ? t("mip3.memoryPool.playing") : t("mip3.memoryPool.autoPlay")}
          </button>
          <p className="w-full sm:w-auto sm:ml-auto font-mono text-xs text-text-tertiary tabular-nums">
            {t("mip3.memoryPool.step")} {stepIdx + 1} / {demoSteps.length}
          </p>
        </div>
      </div>
    </section>
  );
}
