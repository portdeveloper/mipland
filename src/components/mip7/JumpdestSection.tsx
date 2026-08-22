"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

// ── Types ─────────────────────────────────────────────────────────────────────

type ByteRole =
  | "unscanned"
  | "opcode"
  | "jumpdest"       // 0x5B that IS a valid JUMPDEST
  | "extension"      // 0xAE
  | "selector"       // valid extension selector
  | "forbidden"      // forbidden selector (0x5B or 0x60–0x7F)
  | "push-opcode"    // PUSH1–PUSH32
  | "push-data"      // byte consumed as PUSH immediate (not a JUMPDEST)
  | "halted";        // execution would halt

// ── JUMPDEST analysis ─────────────────────────────────────────────────────────

function analyzeBytes(bytes: number[]): ByteRole[] {
  const roles: ByteRole[] = new Array(bytes.length).fill("unscanned");
  let i = 0;
  let halted = false;

  while (i < bytes.length) {
    if (halted) {
      roles[i++] = "halted";
      continue;
    }

    const b = bytes[i];

    // EXTENSION opcode
    if (b === 0xae) {
      roles[i++] = "extension";
      if (i >= bytes.length) break;
      const sel = bytes[i];
      if (sel === 0x5b || (sel >= 0x60 && sel <= 0x7f)) {
        // Forbidden selector
        roles[i++] = "forbidden";
        halted = true;
      } else {
        // Valid selector — analysis returns to normal immediately after
        roles[i++] = "selector";
      }
      continue;
    }

    // JUMPDEST
    if (b === 0x5b) {
      roles[i++] = "jumpdest";
      continue;
    }

    // PUSH1 (0x60) through PUSH32 (0x7F) — also handles PUSH0 (0x5F) as 0 immediates
    if (b >= 0x60 && b <= 0x7f) {
      const n = b - 0x5f; // PUSH1=1, PUSH2=2, …, PUSH32=32
      roles[i++] = "push-opcode";
      for (let j = 0; j < n && i < bytes.length; j++) {
        roles[i++] = "push-data";
      }
      continue;
    }

    roles[i++] = "opcode";
  }

  return roles;
}

// ── Preset examples ───────────────────────────────────────────────────────────

interface Example {
  name: string;
  bytes: number[];
  insight: string;
}

function getExamples(t: (key: string) => string): Example[] {
  return [
    {
      name: t("mip7.jumpdest.example1Name"),
      bytes: [0x60, 0x5b, 0x5b],
      insight:
        "PUSH1 (0x60) marks its next byte as immediate data. That 0x5B is NOT a JUMPDEST. The second 0x5B is standalone, so it IS a valid JUMPDEST.",
    },
    {
      name: t("mip7.jumpdest.example2Name"),
      bytes: [0xae, 0x01, 0x5b],
      insight:
        "0xAE does not consume any bytes during JUMPDEST analysis. After the selector 0x01, the scanner returns to normal, so 0x5B is a valid JUMPDEST.",
    },
    {
      name: t("mip7.jumpdest.example3Name"),
      bytes: [0xae, 0x02, 0x62, 0x5b, 0xa0, 0xff],
      insight:
        "Selector 0x02 is valid. The PUSH3 (0x62) after it causes analysis to eat the next 3 bytes as PUSH immediates, including 0x5B, which is safely consumed and NOT a JUMPDEST.",
    },
    {
      name: t("mip7.jumpdest.example4Name"),
      bytes: [0xae, 0x5b, 0x01],
      insight:
        "0x5B as a selector would make analysis mark it as a JUMPDEST, but execution treats it as a selector. The two disagree: forbidden. Execution halts with all gas consumed.",
    },
    {
      name: t("mip7.jumpdest.example5Name"),
      bytes: [0xae, 0x61, 0xab, 0xcd],
      insight:
        "PUSH2 (0x61) as a selector: analysis sees PUSH2 and eats 0xAB 0xCD as its immediates. Execution treats them as extension arguments. The byte consumption diverges between chains. Forbidden. Halt.",
    },
  ];
}

// ── Role display config ────────────────────────────────────────────────────────

function roleConfig(role: ByteRole): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (role) {
    case "extension":
      return {
        bg: "bg-text-primary",
        text: "text-surface",
        border: "border-text-primary",
        label: "EXTENSION",
      };
    case "selector":
      return {
        bg: "bg-solution-bg",
        text: "text-solution-accent",
        border: "border-solution-accent",
        label: "selector",
      };
    case "forbidden":
      return {
        bg: "bg-problem-accent",
        text: "text-white",
        border: "border-problem-accent",
        label: "FORBIDDEN",
      };
    case "jumpdest":
      return {
        bg: "bg-solution-bg",
        text: "text-solution-accent",
        border: "border-solution-accent",
        label: "JUMPDEST ✓",
      };
    case "push-opcode":
      return {
        bg: "bg-surface",
        text: "text-text-primary",
        border: "border-text-secondary",
        label: "PUSH",
      };
    case "push-data":
      return {
        bg: "bg-surface",
        text: "text-text-tertiary",
        border: "border-dashed border-border",
        label: "consumed",
      };
    case "halted":
      return {
        bg: "bg-problem-bg",
        text: "text-problem-accent",
        border: "border-problem-cell-hover border-dashed",
        label: "halted",
      };
    case "opcode":
      return {
        bg: "bg-surface-elevated",
        text: "text-text-secondary",
        border: "border-border",
        label: "opcode",
      };
    default:
      return {
        bg: "bg-surface-elevated",
        text: "text-text-tertiary",
        border: "border-border border-dashed",
        label: "",
      };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function JumpdestSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [scanStep, setScanStep] = useState(-1); // -1 = not started
  const [isPlaying, setIsPlaying] = useState(false);

  const EXAMPLES = getExamples(t);
  const example = EXAMPLES[exampleIdx];
  const allRoles = analyzeBytes(example.bytes);
  const totalBytes = example.bytes.length;

  const revealedRoles: ByteRole[] = example.bytes.map((_, i) =>
    i <= scanStep ? allRoles[i] : "unscanned"
  );

  const done = scanStep >= totalBytes - 1;
  const hasForbidden = revealedRoles.includes("forbidden");
  const hasHalted = revealedRoles.includes("halted");

  const handleSelectExample = useCallback((i: number) => {
    setExampleIdx(i);
    setScanStep(-1);
    setIsPlaying(false);
  }, []);

  const handleStep = useCallback(() => {
    if (scanStep < totalBytes - 1) setScanStep((s) => s + 1);
  }, [scanStep, totalBytes]);

  const handleReset = useCallback(() => {
    setScanStep(-1);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setScanStep(-1);
    setIsPlaying(true);
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isPlaying) return;
    if (scanStep >= totalBytes - 1) return;
    const timer = setTimeout(() => {
      setScanStep((s) => {
        if (s + 1 >= totalBytes - 1) {
          setIsPlaying(false);
        }
        return s + 1;
      });
    }, scanStep === -1 ? 300 : 700);
    return () => clearTimeout(timer);
  }, [isPlaying, scanStep, totalBytes]);

  const started = scanStep >= 0;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-elevated relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip7.jumpdest.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip7.jumpdest.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip7.jumpdest.subDesc")}
        </p>

        {/* Example picker */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.name}
              onClick={() => handleSelectExample(i)}
              className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
                i === exampleIdx
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface border-border hover:border-text-secondary"
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>

        {/* Scanner */}
        <div className="bg-surface rounded-xl border border-border p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
              {t("mip7.jumpdest.scanner")}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-text-tertiary">{t("mip7.jumpdest.left")}</span>
              <svg width="28" height="8" viewBox="0 0 28 8" fill="none">
                <path
                  d="M0 4h24M20 1l4 3-4 3"
                  stroke="#9b9084"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-mono text-[10px] text-text-tertiary">{t("mip7.jumpdest.right")}</span>
            </div>
          </div>

          {/* Byte cells */}
          <div className="flex flex-wrap gap-3 mb-6">
            {example.bytes.map((b, i) => {
              const role = revealedRoles[i];
              const cfg = roleConfig(role);
              const isCurrent = i === scanStep;
              const hex = `0x${b.toString(16).toUpperCase().padStart(2, "0")}`;

              return (
                <motion.div
                  key={i}
                  animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                  >
                    <span className="font-mono text-sm font-semibold">{hex}</span>
                  </div>
                  <AnimatePresence mode="wait">
                    {role !== "unscanned" && (
                      <motion.p
                        key={role}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`font-mono text-[9px] text-center leading-tight ${cfg.text}`}
                      >
                        {cfg.label}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Insight */}
          <AnimatePresence mode="wait">
            {done && (
              <motion.div
                key="insight"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-lg border p-4 mb-4 ${
                  hasForbidden || hasHalted
                    ? "bg-problem-bg border-problem-cell-hover"
                    : "bg-solution-bg border-solution-accent-light"
                }`}
              >
                <p
                  className={`font-mono text-sm ${
                    hasForbidden || hasHalted
                      ? "text-problem-accent"
                      : "text-solution-accent"
                  }`}
                >
                  {example.insight}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={started && !isPlaying ? handleReset : undefined}
              disabled={!started || isPlaying}
              className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
                started && !isPlaying
                  ? "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
                  : "bg-surface-elevated border-border text-text-tertiary cursor-default"
              }`}
            >
              {t("mip7.jumpdest.reset")}
            </button>
            <button
              onClick={!done && !isPlaying ? handleStep : undefined}
              disabled={done || isPlaying}
              className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
                !done && !isPlaying
                  ? "bg-solution-accent text-white border-solution-accent hover:bg-solution-accent/90 cursor-pointer"
                  : "bg-surface-elevated border-border text-text-tertiary cursor-default"
              }`}
            >
              {!started ? t("mip7.jumpdest.startScan") : done ? t("mip7.jumpdest.done") : t("mip7.jumpdest.stepArrow")}
            </button>
            <button
              onClick={!isPlaying ? handlePlay : undefined}
              disabled={isPlaying}
              className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
                !isPlaying
                  ? "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
                  : "bg-surface-elevated border-border text-text-tertiary cursor-default"
              }`}
            >
              {isPlaying ? t("mip7.jumpdest.scanning") : t("mip7.jumpdest.autoScan")}
            </button>
            <p className="w-full sm:w-auto sm:ml-auto font-mono text-xs text-text-tertiary tabular-nums">
              {Math.max(0, scanStep + 1)} / {totalBytes} {t("mip7.jumpdest.bytes")}
            </p>
          </div>
        </div>

        {/* Color legend */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-3">
            {t("mip7.jumpdest.legend")}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { role: "extension" as ByteRole, desc: t("mip7.jumpdest.extensionGateway") },
              { role: "selector" as ByteRole, desc: t("mip7.jumpdest.validSelector") },
              { role: "forbidden" as ByteRole, desc: t("mip7.jumpdest.forbiddenHalt") },
              { role: "jumpdest" as ByteRole, desc: t("mip7.jumpdest.validJumpdest") },
              { role: "push-opcode" as ByteRole, desc: t("mip7.jumpdest.pushOpcode") },
              { role: "push-data" as ByteRole, desc: t("mip7.jumpdest.pushConsumed") },
              { role: "opcode" as ByteRole, desc: t("mip7.jumpdest.regularOpcode") },
            ].map(({ role, desc }) => {
              const cfg = roleConfig(role);
              return (
                <div key={role} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded border-2 shrink-0 ${cfg.bg} ${cfg.border}`}
                  />
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
