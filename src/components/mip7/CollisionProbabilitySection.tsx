"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useInView } from "../useInView";
import { useLanguage } from "@/i18n/LanguageContext";

const HARD_FORKS = [
  { name: "Homestead", year: 2016, newOpcodes: 1, opcodes: ["DELEGATECALL"] },
  { name: "Tangerine", year: 2016, newOpcodes: 0, opcodes: [] },
  { name: "Spurious Dragon", year: 2016, newOpcodes: 0, opcodes: [] },
  {
    name: "Byzantium",
    year: 2017,
    newOpcodes: 4,
    opcodes: ["REVERT", "RETURNDATASIZE", "RETURNDATACOPY", "STATICCALL"],
  },
  {
    name: "Constantinople",
    year: 2019,
    newOpcodes: 5,
    opcodes: ["SHL", "SHR", "SAR", "EXTCODEHASH", "CREATE2"],
  },
  {
    name: "Istanbul",
    year: 2019,
    newOpcodes: 2,
    opcodes: ["CHAINID", "SELFBALANCE"],
  },
  { name: "Berlin", year: 2021, newOpcodes: 0, opcodes: [] },
  { name: "London", year: 2021, newOpcodes: 1, opcodes: ["BASEFEE"] },
  { name: "Shanghai", year: 2023, newOpcodes: 1, opcodes: ["PUSH0"] },
  {
    name: "Cancun",
    year: 2024,
    newOpcodes: 5,
    opcodes: ["BLOBHASH", "BLOBBASEFEE", "TLOAD", "TSTORE", "MCOPY"],
  },
  { name: "Pectra", year: 2025, newOpcodes: 0, opcodes: [] },
  { name: "Fusaka", year: 2026, newOpcodes: 1, opcodes: ["CLZ"] },
];

const TOTAL_FORKS = HARD_FORKS.length; // 12
const TOTAL_OPCODES = HARD_FORKS.reduce((s, f) => s + f.newOpcodes, 0); // 20
// Span from Homestead (2016-03-14) to Fusaka (2026-Q1)
const PERIOD_YEARS = 9.95;
const HISTORICAL_FORK_RATE = TOTAL_FORKS / PERIOD_YEARS; // ~1.21/yr
const OPCODES_PER_FORK = TOTAL_OPCODES / TOTAL_FORKS; // ~1.67
const OPCODE_RATE = TOTAL_OPCODES / PERIOD_YEARS; // ~2.01/yr

// Defined Ethereum opcodes after Fusaka: 150. Free space: 256 - 150 = 106.
const FREE_SLOTS = 106;

function pYearly(n: number) {
  return 1 - Math.pow(1 - n / FREE_SLOTS, OPCODE_RATE);
}

function pCumulative(p: number, years: number) {
  return 1 - Math.pow(1 - p, years);
}

function fmtPct(p: number) {
  if (p === 0) return "0%";
  const pctVal = p * 100;
  if (pctVal >= 1) return pctVal.toFixed(2) + "%";
  const decimals = Math.min(10, -Math.floor(Math.log10(pctVal)) + 2);
  return pctVal.toFixed(decimals) + "%";
}

// Confidence values can crowd up against 100% — show enough decimals to keep
// adjacent slider positions distinguishable.
function fmtPctConfidence(p: number) {
  if (p >= 1) return "100%";
  if (p <= 0) return "0%";
  const distPct = 100 - p * 100;
  if (distPct >= 1) return fmtPct(p);
  const decimals = Math.min(10, -Math.floor(Math.log10(distPct)) + 2);
  return (p * 100).toFixed(decimals) + "%";
}

function fmtOneIn(p: number) {
  if (p <= 0) return "-";
  const n = 1 / p;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return Math.round(n / 1000).toLocaleString() + "K";
  return Math.round(n).toLocaleString();
}

const STAGES: { key: "a" | "b" | "c" | "e"; done: boolean }[] = [
  { key: "a", done: true },
  { key: "b", done: true },
  { key: "c", done: false },
  { key: "e", done: false },
];

const CURRENT_STAGE_IDX = 1;

// Maps slider 0..100 (strength of commitment) to P(EIP-8163 not upheld).
// 0 → 1 (no commitment, no protection). 100 → 0 (certain). Log-spaced in between.
const MAX_DECADES = 6;
function strengthToFailProb(strength: number): number {
  if (strength <= 0) return 1;
  if (strength >= 100) return 0;
  return Math.pow(10, -(strength / 100) * MAX_DECADES);
}

export default function CollisionProbabilitySection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [mode, setMode] = useState<"without" | "with">("without");
  const [n, setN] = useState<1 | 8 | 16>(8);
  const [strength, setStrength] = useState(50);

  const baseN = mode === "without" ? n : 1;
  const pBase = pYearly(baseN);
  const pUpholdFail = strengthToFailProb(strength);
  const upholdMult = mode === "with" ? pUpholdFail : 1;
  const pFinal = pBase * upholdMult;
  const p10 = pCumulative(pFinal, 10);

  const isProblem = mode === "without";

  return (
    <section ref={ref} className="py-24 px-6 bg-surface relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip7.collisionProb.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip7.collisionProb.desc")}
        </p>

        {/* Derivation panel */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-6">
          <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-5">
            {t("mip7.collisionProb.derivation")}
          </p>

          {/* Step 1: forks timeline */}
          <p className="font-mono text-[11px] text-text-tertiary mb-2">
            <span className="text-text-secondary font-semibold">1.</span>{" "}
            {t("mip7.collisionProb.step1")}
          </p>
          <div className="grid gap-1.5 mb-5" style={{ gridTemplateColumns: "repeat(12, minmax(0, 1fr))" }}>
            {HARD_FORKS.map((f) => (
              <div
                key={f.name}
                title={`${f.name} ${f.year}\n+${f.newOpcodes} opcodes${
                  f.opcodes.length ? ": " + f.opcodes.join(", ") : ""
                }`}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full font-mono text-[11px] font-semibold rounded text-center py-1.5 ${
                    f.newOpcodes > 0
                      ? "bg-solution-cell text-solution-accent border border-solution-accent-light"
                      : "bg-surface text-text-tertiary border border-border"
                  }`}
                >
                  +{f.newOpcodes}
                </div>
                <p
                  className="font-mono text-[9px] text-text-tertiary truncate w-full text-center"
                  title={f.name}
                >
                  {f.name.split(" ")[0]}
                </p>
                <p className="font-mono text-[9px] text-text-tertiary">
                  ’{(f.year % 100).toString().padStart(2, "0")}
                </p>
              </div>
            ))}
          </div>

          {/* Step 2-4: stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Stat
              step="2"
              label={t("mip7.collisionProb.forkRate")}
              value={HISTORICAL_FORK_RATE.toFixed(2)}
              unit={t("mip7.collisionProb.perYear")}
              note={`${TOTAL_FORKS} ${t("mip7.collisionProb.forks")} / ${PERIOD_YEARS} ${t("mip7.collisionProb.years")}`}
            />
            <Stat
              step="3"
              label={t("mip7.collisionProb.opPerFork")}
              value={OPCODES_PER_FORK.toFixed(2)}
              unit={t("mip7.collisionProb.perFork")}
              note={`${TOTAL_OPCODES} ${t("mip7.collisionProb.opcodes")} / ${TOTAL_FORKS} ${t("mip7.collisionProb.forks")}`}
            />
            <Stat
              step="4"
              label={t("mip7.collisionProb.opcodeRate")}
              value={OPCODE_RATE.toFixed(2)}
              unit={t("mip7.collisionProb.perYear")}
              note={`${HISTORICAL_FORK_RATE.toFixed(2)} × ${OPCODES_PER_FORK.toFixed(2)}`}
              accent
            />
          </div>
          <p className="font-mono text-[10px] text-text-tertiary">
            {t("mip7.collisionProb.derivationFootnote")}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("without")}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
              mode === "without"
                ? "bg-problem-accent text-white border-problem-accent"
                : "bg-surface-elevated border-border hover:border-text-secondary"
            }`}
          >
            {t("mip7.collisionProb.modeWithout")}
          </button>
          <button
            onClick={() => setMode("with")}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all cursor-pointer ${
              mode === "with"
                ? "bg-solution-accent text-white border-solution-accent"
                : "bg-surface-elevated border-border hover:border-text-secondary"
            }`}
          >
            {t("mip7.collisionProb.modeWith")}
          </button>
        </div>

        {/* Mode-specific controls */}
        {mode === "without" ? (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="font-mono text-xs text-text-tertiary mr-1">
              {t("mip7.collisionProb.customOpcodes")}
            </span>
            {([1, 8, 16] as const).map((v) => (
              <button
                key={v}
                onClick={() => setN(v)}
                className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer tabular-nums ${
                  n === v
                    ? "bg-text-primary text-surface border-text-primary"
                    : "bg-surface-elevated border-border hover:border-text-secondary"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-surface-elevated rounded-xl border border-border p-5 mb-6">
            <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-4">
              {t("mip7.collisionProb.eipStages")}
            </p>
            <div className="space-y-1.5">
              {STAGES.map((s, i) => {
                const isCurrent = i === CURRENT_STAGE_IDX;
                return (
                  <div
                    key={s.key}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-surface"
                  >
                    <div
                      className={`flex items-center justify-center w-5 h-5 rounded-sm border-2 shrink-0 ${
                        s.done
                          ? "bg-solution-accent border-solution-accent"
                          : "border-text-tertiary bg-transparent"
                      }`}
                    >
                      {s.done && (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 6l2.5 2.5L9.5 3.5"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="font-mono text-xs flex-1 text-text-secondary">
                      {t(`mip7.collisionProb.stage_${s.key}`)}
                    </p>
                    {isCurrent && (
                      <span className="font-mono text-[9px] uppercase tracking-wider text-solution-muted bg-solution-cell px-1.5 py-0.5 rounded shrink-0">
                        {t("mip7.collisionProb.currentStage")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slider for user belief */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="font-mono text-xs text-text-secondary leading-snug mb-3">
                {t("mip7.collisionProb.sliderPrompt")}
              </p>
              <p className="font-mono text-3xl font-semibold text-solution-accent tabular-nums mb-3">
                {fmtPctConfidence(1 - pUpholdFail)}
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                aria-label={t("mip7.collisionProb.sliderPrompt")}
                className="w-full accent-solution-accent cursor-pointer"
              />
              <div className="flex justify-between mt-2 font-mono text-[10px] text-text-tertiary">
                <span>{t("mip7.collisionProb.sliderWeak")}</span>
                <span>{t("mip7.collisionProb.sliderStrong")}</span>
              </div>
              <p className="font-mono text-[10px] text-text-tertiary mt-3">
                {t("mip7.collisionProb.sliderNote")}
              </p>
            </div>
          </div>
        )}

        {/* Result panel */}
        <div
          className={`rounded-xl border p-6 transition-colors ${
            isProblem
              ? "bg-problem-bg border-problem-cell-hover"
              : "bg-solution-bg border-solution-accent-light"
          }`}
        >
          <p
            className={`font-mono text-xs uppercase tracking-wider mb-4 ${
              isProblem ? "text-problem-accent" : "text-solution-muted"
            }`}
          >
            {t("mip7.collisionProb.yearlyConflict")}
          </p>

          {/* Math expression */}
          <div className="mb-6 font-mono text-sm space-y-1.5 break-words">
            {mode === "without" ? (
              <>
                <p className="text-text-secondary">
                  {t("mip7.collisionProb.formulaIntro")}{" "}
                  <span className="text-text-tertiary">
                    P = 1 − (1 − N/{FREE_SLOTS})
                    <sup>λ</sup>
                  </span>
                </p>
                <p>
                  P = 1 − (1 − <span className="text-problem-accent font-semibold">{baseN}</span>
                  /{FREE_SLOTS})
                  <sup>{OPCODE_RATE.toFixed(2)}</sup> ={" "}
                  <span className="text-problem-accent font-semibold tabular-nums">
                    {fmtPct(pFinal)}
                  </span>
                </p>
              </>
            ) : (
              <>
                <p className="text-text-secondary">
                  {t("mip7.collisionProb.formulaIntroMip7")}
                </p>
                <p>
                  P<sub>base</sub> = 1 − (1 − 1/{FREE_SLOTS})
                  <sup>{OPCODE_RATE.toFixed(2)}</sup> ={" "}
                  <span className="text-text-primary tabular-nums">
                    {fmtPct(pBase)}
                  </span>
                </p>
                <p>
                  P<sub>upheld</sub> ={" "}
                  <span className="text-text-primary tabular-nums">
                    {fmtPct(1 - pUpholdFail)}
                  </span>{" "}
                  <span className="text-text-tertiary">
                    ({t("mip7.collisionProb.fromSlider")})
                  </span>
                </p>
                <p>
                  P = P<sub>base</sub> × (1 − P<sub>upheld</sub>) ={" "}
                  <span className="text-solution-accent font-semibold tabular-nums">
                    {fmtPct(pFinal)}
                  </span>
                </p>
              </>
            )}
          </div>

          {/* Big result cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface rounded-lg p-5 border border-border">
              <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-2">
                {t("mip7.collisionProb.perYearProb")}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`y-${mode}-${baseN}-${strength}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className={`text-4xl font-semibold tabular-nums ${
                    pFinal === 0
                      ? "text-solution-accent"
                      : isProblem
                      ? "text-problem-accent"
                      : "text-solution-accent"
                  }`}
                >
                  {fmtPct(pFinal)}
                </motion.p>
              </AnimatePresence>
              <p className="font-mono text-xs text-text-tertiary mt-2">
                {pFinal > 0
                  ? `${t("mip7.collisionProb.lotteryPrefix")}${fmtOneIn(pFinal)}${t("mip7.collisionProb.lotterySuffix")}`
                  : t("mip7.collisionProb.zeroChance")}
              </p>
            </div>
            <div className="bg-surface rounded-lg p-5 border border-border">
              <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-2">
                {t("mip7.collisionProb.tenYearProb")}
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`c-${mode}-${baseN}-${strength}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className={`text-4xl font-semibold tabular-nums ${
                    p10 === 0
                      ? "text-solution-accent"
                      : isProblem && p10 > 0.5
                      ? "text-problem-accent"
                      : isProblem
                      ? "text-text-primary"
                      : "text-solution-accent"
                  }`}
                >
                  {fmtPct(p10)}
                </motion.p>
              </AnimatePresence>
              <p className="font-mono text-xs text-text-tertiary mt-2">
                {t("mip7.collisionProb.tenYearNote")}
              </p>
            </div>
          </div>

          {/* 10-year ticket strip */}
          <div className="mt-6">
            <p className="font-mono text-xs text-text-secondary mb-3">
              {t("mip7.collisionProb.ticketStripLabel")}
            </p>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 10 }, (_, i) => {
                const year = 2026 + i;
                const cumByEnd = pCumulative(pFinal, i + 1);
                const fillPct = Number(
                  Math.min(100, Math.max(0.5, cumByEnd * 100)).toFixed(2)
                );
                return (
                  <div
                    key={i}
                    title={`${year}: ${fmtPct(cumByEnd)} cumulative`}
                    className="rounded-md border border-border overflow-hidden bg-surface flex flex-col"
                  >
                    <div className="h-12 relative bg-surface">
                      <motion.div
                        initial={false}
                        animate={{ height: `${fillPct}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`absolute bottom-0 left-0 right-0 ${
                          isProblem
                            ? "bg-problem-accent/70"
                            : "bg-solution-accent/70"
                        }`}
                      />
                    </div>
                    <p className="font-mono text-[9px] text-text-tertiary text-center py-1 border-t border-border">
                      ’{(year % 100).toString().padStart(2, "0")}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-2">
              {t("mip7.collisionProb.ticketStripFootnote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  step,
  label,
  value,
  unit,
  note,
  accent,
}: {
  step: string;
  label: string;
  value: string;
  unit: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        accent
          ? "bg-solution-bg border-solution-accent-light"
          : "bg-surface border-border"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="font-mono text-[9px] font-semibold text-text-tertiary tabular-nums">
          {step}.
        </span>
        <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p
        className={`font-mono text-2xl font-semibold tabular-nums ${
          accent ? "text-solution-accent" : "text-text-primary"
        }`}
      >
        {value}
      </p>
      <p className="font-mono text-[10px] text-text-tertiary">{unit}</p>
      <p className="font-mono text-[9px] text-text-tertiary mt-1">{note}</p>
    </div>
  );
}
