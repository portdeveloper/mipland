"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useExplainMode } from "./ExplainModeContext";

const COLS = 9;
const ROWS = 6;
const TOTAL = COLS * ROWS;

type CellType = "user" | "spam-idle" | "spam-fail" | "spam-success";

const CELL_CONFIG: Record<
  CellType,
  { bg: string; symbol: string; textColor: string }
> = {
  user: { bg: "#d4e4f4", symbol: "", textColor: "transparent" },
  "spam-idle": { bg: "#f0d0c0", symbol: "\u2014", textColor: "#c4653a80" },
  "spam-fail": { bg: "#e8b8a8", symbol: "\u00d7", textColor: "#c4653a" },
  "spam-success": { bg: "#c8e6d8", symbol: "\u2713", textColor: "#2a7d6a" },
};

function generateBlock(): CellType[] {
  const cells: CellType[] = [];
  // ~30% user, ~48% spam-idle, ~18% spam-fail, one spam-success per ~2 blocks
  const successIdx = Math.random() < 0.6 ? Math.floor(Math.random() * TOTAL) : -1;
  for (let i = 0; i < TOTAL; i++) {
    if (i === successIdx) {
      cells.push("spam-success");
    } else {
      const r = Math.random();
      if (r < 0.3) cells.push("user");
      else if (r < 0.78) cells.push("spam-idle");
      else cells.push("spam-fail");
    }
  }
  return cells;
}

// Static initial grid to avoid hydration mismatch (no Math.random on SSR)
const INITIAL_GRID: CellType[] = Array.from({ length: TOTAL }, (_, i) => {
  // Deterministic pattern: ~30% user, ~48% spam-idle, ~18% spam-fail, 1 success
  if (i === 25) return "spam-success";
  const mod = i % 10;
  if (mod < 3) return "user";
  if (mod < 8) return "spam-idle";
  return "spam-fail";
});

export default function SpamHeroSection() {
  const [cells, setCells] = useState<CellType[]>(INITIAL_GRID);
  const [revealCount, setRevealCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Only start random generation after hydration
  useEffect(() => {
    setMounted(true);
    setCells(generateBlock());
  }, []);

  const startCycle = useCallback(() => {
    setCells(generateBlock());
    setRevealCount(0);
  }, []);

  // Reveal cells one by one
  useEffect(() => {
    if (!mounted) return;
    if (revealCount >= TOTAL) {
      const timer = setTimeout(() => {
        setCycle((c) => c + 1);
        startCycle();
      }, 3500);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(
      () => setRevealCount((c) => c + 1),
      revealCount === 0 ? 800 : 25
    );
    return () => clearTimeout(timer);
  }, [revealCount, startCycle, cycle, mounted]);

  const spamCount = cells.filter((c) => c !== "user").length;
  const successCount = cells.filter((c) => c === "spam-success").length;
  const { mode } = useExplainMode();
  const simple = mode === "simple";

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center py-20"
      >
        {/* Left: text */}
        <div>
          <h1 className="text-5xl sm:text-6xl font-light leading-[1.05] tracking-tight mb-8">
            Spam{" "}
            <span className="font-bold text-problem-accent">MEV</span>
          </h1>
          <p className="text-lg text-text-secondary font-light leading-relaxed mb-8 max-w-md">
            {simple
              ? "Bots flood blockchains with thousands of speculative transactions. Most fail, but they still clog the block and raise costs for everyone."
              : "Speculative probes that search for MEV on-chain at execution time, consuming around a quarter of blockspace while rarely producing a trade."}
          </p>
          <p className="text-base text-problem-accent/80 font-light italic leading-relaxed max-w-md">
            {simple ? (
              <>
                Why does this happen? How bad is it?
                <br />
                And what can we do about it?
              </>
            ) : (
              <>
                Why does spam emerge? What does it cost?
                <br />
                And what can blockchain designers do about it?
              </>
            )}
          </p>
        </div>

        {/* Right: block grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-mono text-[11px] text-text-tertiary tracking-wider uppercase mb-3">
            Block gas
          </p>
          <div className="bg-surface-elevated rounded-xl p-4 border border-border shadow-sm">
            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((type, i) => {
                const cfg = CELL_CONFIG[type];
                const revealed = i < revealCount;
                return (
                  <motion.div
                    key={`${cycle}-${i}`}
                    className="aspect-square rounded-sm flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      revealed
                        ? {
                            opacity: 1,
                            scale: 1,
                            backgroundColor: cfg.bg,
                          }
                        : { opacity: 0.15, scale: 1, backgroundColor: "#e2ddd7" }
                    }
                    transition={{
                      duration: 0.15,
                      backgroundColor: {
                        duration:
                          type === "spam-success" && revealCount >= TOTAL
                            ? 0.6
                            : 0.15,
                      },
                    }}
                  >
                    {revealed && cfg.symbol && (
                      <span
                        className="font-mono text-xs font-semibold select-none leading-none"
                        style={{ color: cfg.textColor }}
                      >
                        {cfg.symbol}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Stats */}
            <motion.div
              className="flex items-center justify-between mt-3 pt-3 border-t border-border"
              animate={{ opacity: revealCount >= TOTAL ? 1 : 0.3 }}
            >
              <p className="font-mono text-xs text-text-tertiary">
                <span className="text-problem-accent font-semibold">
                  {Math.round((spamCount / TOTAL) * 100)}%
                </span>{" "}
                spam
              </p>
              <p className="font-mono text-xs text-text-tertiary">
                <span className="text-solution-accent font-semibold">
                  {successCount}
                </span>{" "}
                / {spamCount} found a trade
              </p>
            </motion.div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {(
              [
                ["spam-idle", "Spam, no trade"],
                ["spam-fail", "Spam, reverted"],
                ["spam-success", "Spam, trade found"],
                ["user", "Non-spam transaction"],
              ] as const
            ).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-[2px]"
                  style={{ backgroundColor: CELL_CONFIG[type].bg }}
                />
                <span className="font-mono text-[10px] text-text-tertiary">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
