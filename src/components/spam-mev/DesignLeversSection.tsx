"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useInView } from "../useInView";
import { useUrlState, intParam, oneOfParam } from "../useUrlState";
import type { UrlParamCodec } from "../useUrlState";
import { useExplainMode } from "./ExplainModeContext";
import Hint from "./Hint";
import {
  computeEquilibrium,
  computeEquilibriumPFO,
  marginalUserShare,
  DEFAULTS,
} from "./model";
import type { ModelParams } from "./model";

const MAX_BMAX = 2000;

// "bmax" belongs to the equilibrium slider above, so this section's
// capacity lever gets its own key
const LEVER_BMAX_PARAM = intParam(200, MAX_BMAX);
const GMIN_PARAM = intParam(1, 80);
const ORDERING_PARAM = oneOfParam(["random", "pfo"] as const);

// v lives in state as a 0-1 fraction but travels as a whole percent (v=50)
const V_PARAM: UrlParamCodec<number> = {
  parse: (raw) => {
    const pct = intParam(0, 100).parse(raw);
    return pct === null ? null : pct / 100;
  },
  serialize: (v) => String(Math.round(v * 100)),
};

function MarginalCapacityChart({
  params,
  Bmax,
}: {
  params: ModelParams;
  Bmax: number;
}) {
  const W = 620;
  const H = 200;
  const padL = 48;
  const padR = 44;
  const padT = 12;
  const padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const x = (b: number) => padL + (b / MAX_BMAX) * chartW;
  const yVal = (v: number) => padT + chartH - v * chartH;

  const eq = computeEquilibrium(0, params);
  const Bplat = eq.Bplat;

  // Compute marginal user share curve
  const points = useMemo(() => {
    const pts: { b: number; m: number }[] = [];
    for (let b = 0; b <= Math.min(Bplat + 50, MAX_BMAX); b += 5) {
      pts.push({ b, m: marginalUserShare(b, params) });
    }
    return pts;
  }, [params, Bplat]);

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.b)},${yVal(p.m)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L${x(points[points.length - 1]?.b ?? 0)},${yVal(0)} L${x(0)},${yVal(0)} Z`;

  const currentM = marginalUserShare(Bmax, params);
  const cx = x(Math.min(Bmax, Bplat + 50));

  // Threshold lines at 80%, 60%, 40%
  const thresholds = [
    { pct: 0.8, label: "80%", color: "#2a7d6a" },
    { pct: 0.6, label: "60%", color: "#c4653a" },
    { pct: 0.4, label: "40%", color: "#c4653a" },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: 240 }}
    >
      {/* Area under curve */}
      <path d={areaPath} fill="#3b7dd8" opacity={0.1} />

      {/* Threshold lines */}
      {thresholds.map((t) => (
        <g key={t.pct}>
          <line
            x1={padL}
            y1={yVal(t.pct)}
            x2={padL + chartW}
            y2={yVal(t.pct)}
            stroke={t.color}
            strokeWidth={0.5}
            strokeDasharray="4 4"
            opacity={0.4}
          />
          <text
            x={padL + chartW + 2}
            y={yVal(t.pct) + 3}
            className="font-mono"
            fontSize={8}
            fill={t.color}
            opacity={0.6}
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* Main curve */}
      <path d={linePath} fill="none" stroke="#1a1714" strokeWidth={2} />

      {/* Current position */}
      {Bmax <= Bplat + 50 && (
        <>
          <line
            x1={cx}
            y1={padT}
            x2={cx}
            y2={padT + chartH}
            stroke="#1a1714"
            strokeWidth={1}
            opacity={0.3}
          />
          <circle cx={cx} cy={yVal(currentM)} r={5} fill="#1a1714" />
          <text
            x={cx + 8}
            y={yVal(currentM) - 6}
            className="font-mono"
            fontSize={10}
            fill="#1a1714"
            fontWeight={600}
          >
            {(currentM * 100).toFixed(0)}%
          </text>
        </>
      )}

      {/* Axes */}
      <line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#e2ddd7"
      />
      <line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + chartH}
        stroke="#e2ddd7"
      />

      <text
        x={padL + chartW / 2}
        y={H - 4}
        textAnchor="middle"
        className="font-mono"
        fontSize={10}
        fill="#9b9084"
      >
        B_max
      </text>
      <text
        x={10}
        y={padT + chartH / 2}
        textAnchor="middle"
        className="font-mono"
        fontSize={9}
        fill="#9b9084"
        transform={`rotate(-90, 10, ${padT + chartH / 2})`}
      >
        user share
      </text>
    </svg>
  );
}

export default function DesignLeversSection() {
  const { ref, isVisible } = useInView(0.1);
  const { mode } = useExplainMode();
  const simple = mode === "simple";
  const [Bmax, setBmax] = useUrlState("cap", 1000, LEVER_BMAX_PARAM);
  const [gmin, setGmin] = useUrlState("gmin", DEFAULTS.gmin, GMIN_PARAM);
  const [ordering, setOrdering] = useUrlState<"random" | "pfo">(
    "ordering",
    "random",
    ORDERING_PARAM
  );
  const [v, setV] = useUrlState("v", 0.5, V_PARAM);

  const params: ModelParams = useMemo(
    () => ({ ...DEFAULTS, gmin: Math.max(1, gmin) }),
    [gmin]
  );

  const eqRandom = computeEquilibrium(Bmax, params);
  const eqCurrent =
    ordering === "pfo"
      ? computeEquilibriumPFO(Bmax, v, params)
      : eqRandom;

  // Baseline for comparison (gmin=0, random ordering)
  const eqBaseline = computeEquilibrium(Bmax, { ...DEFAULTS, gmin: 1 });

  const spamReduction =
    eqBaseline.spamGas > 0
      ? ((eqBaseline.spamGas - eqCurrent.spamGas) / eqBaseline.spamGas) * 100
      : 0;

  const userPct =
    MAX_BMAX > 0 ? (eqCurrent.Qu / MAX_BMAX) * 100 : 0;
  const spamPct =
    MAX_BMAX > 0 ? (eqCurrent.spamGas / MAX_BMAX) * 100 : 0;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-alt relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {simple ? "Three ways to fight spam" : "Three levers to reduce spam"}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-12">
          {simple
            ? "Blockchain designers have three knobs to turn. Each one reduces spam but might also affect real users. Try adjusting them to see the tradeoffs."
            : "Blockchain designers can adjust block capacity, set a minimum gas price floor, and choose transaction ordering. Each lever trades off spam reduction against user welfare."}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls panel */}
          <div className="space-y-4">
            {/* Bmax */}
            <div className="bg-surface-elevated rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="lever-bmax"
                  className="font-mono text-xs text-text-tertiary"
                >
                  {simple ? "Block size" : <Hint term="b_max">Block capacity (B_max)</Hint>}
                </label>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {Bmax}
                </span>
              </div>
              <input
                id="lever-bmax"
                type="range"
                min={200}
                max={MAX_BMAX}
                value={Bmax}
                onChange={(e) => setBmax(Number(e.target.value))}
                className="w-full accent-text-primary cursor-pointer"
              />
            </div>

            {/* gmin */}
            <div className="bg-surface-elevated rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="lever-gmin"
                  className="font-mono text-xs text-text-tertiary"
                >
                  {simple ? "Minimum fee" : <Hint term="gmin">Minimum gas price (g_min)</Hint>}
                </label>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {gmin}
                </span>
              </div>
              <input
                id="lever-gmin"
                type="range"
                min={1}
                max={80}
                value={gmin}
                onChange={(e) => setGmin(Number(e.target.value))}
                className="w-full accent-text-primary cursor-pointer"
              />
              <div className="flex justify-between font-mono text-xs text-text-tertiary mt-1">
                <span>1 (near zero)</span>
                <span>80</span>
              </div>
            </div>

            {/* Ordering toggle */}
            <div className="bg-surface-elevated rounded-xl border border-border p-5">
              <p className="font-mono text-xs text-text-tertiary mb-3">
                Transaction ordering
              </p>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setOrdering("random")}
                  className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer flex-1 ${
                    ordering === "random"
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface border-border hover:border-text-secondary"
                  }`}
                >
                  {simple ? "First come, first served" : "Random / FIFO"}
                </button>
                <button
                  onClick={() => setOrdering("pfo")}
                  className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer flex-1 ${
                    ordering === "pfo"
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface border-border hover:border-text-secondary"
                  }`}
                >
                  {simple ? "Highest bidder first" : <><Hint term="pfo">Priority fee</Hint></>}
                </button>
              </div>

              {ordering === "pfo" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="lever-v"
                      className="font-mono text-[11px] text-text-tertiary"
                    >
                      Users bidding for priority (v)
                    </label>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {(v * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    id="lever-v"
                    type="range"
                    min={0}
                    max={100}
                    value={v * 100}
                    onChange={(e) => setV(Number(e.target.value) / 100)}
                    className="w-full accent-text-primary cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results panel */}
          <div className="space-y-4">
            {/* Block bar */}
            <div className="bg-surface-elevated rounded-xl border border-border p-5">
              <p className="font-mono text-xs text-text-tertiary mb-3">
                Block composition with current settings
              </p>
              <div className="relative h-10 bg-border/30 rounded-lg overflow-hidden mb-3">
                <motion.div
                  className="absolute top-0 bottom-0 left-0 rounded-l-lg"
                  style={{ backgroundColor: "#3b7dd8" }}
                  animate={{ width: `${userPct}%` }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.div
                  className="absolute top-0 bottom-0"
                  style={{ backgroundColor: "#c4653a" }}
                  animate={{
                    left: `${userPct}%`,
                    width: `${spamPct}%`,
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Comparison: narrative in simple, raw numbers in technical */}
              {simple ? (
                <div className="text-sm text-text-secondary leading-relaxed">
                  {spamReduction > 50 ? (
                    <p>
                      These settings cut spam by{" "}
                      <strong className="text-solution-accent">
                        {Math.round(spamReduction)}%
                      </strong>{" "}
                      compared to having no fee floor. Spam now takes up just{" "}
                      {Math.round(eqCurrent.spamShare * 100)}% of the block.
                      {ordering === "pfo" &&
                        " Priority ordering pushes spam bots to the back of the block where they can't grab the best positions."}
                    </p>
                  ) : spamReduction > 10 ? (
                    <p>
                      Spam is down{" "}
                      <strong>{Math.round(spamReduction)}%</strong> from the
                      no-floor baseline. Try raising the minimum fee higher to
                      see a bigger effect.
                    </p>
                  ) : eqCurrent.spamShare === 0 ? (
                    <p className="text-solution-accent font-medium">
                      No spam at these settings. The block is too small or fees
                      too high for bots to profit.
                    </p>
                  ) : (
                    <p>
                      Spam still takes up{" "}
                      {Math.round(eqCurrent.spamShare * 100)}% of the block.
                      Try increasing the minimum fee or switching to priority
                      ordering.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="font-mono text-[10px] text-text-tertiary mb-1">
                      Spam share
                    </p>
                    <motion.p
                      key={`share-${Math.round(eqCurrent.spamShare * 1000)}`}
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      className="font-mono text-lg font-semibold tabular-nums"
                      style={{
                        color:
                          eqCurrent.spamShare > 0.15 ? "#c4653a" : "#2a7d6a",
                      }}
                    >
                      {(eqCurrent.spamShare * 100).toFixed(1)}%
                    </motion.p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-text-tertiary mb-1">
                      Gas price
                    </p>
                    <p className="font-mono text-lg font-semibold tabular-nums">
                      {eqCurrent.g.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-text-tertiary mb-1">
                      Spam reduction
                    </p>
                    <motion.p
                      key={`red-${Math.round(spamReduction)}`}
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      className="font-mono text-lg font-semibold tabular-nums"
                      style={{
                        color: spamReduction > 30 ? "#2a7d6a" : "#9b9084",
                      }}
                    >
                      {spamReduction > 0 ? `${spamReduction.toFixed(0)}%` : "--"}
                    </motion.p>
                    <p className="font-mono text-[9px] text-text-tertiary">
                      vs g_min=1
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Monad callout */}
            <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-5">
              <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-2">
                Monad&apos;s approach
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {simple
                  ? "Monad charges bots for the gas they reserve, even when their transaction fails. Since spam transactions reserve a lot of gas but barely use any, this makes spamming much more expensive."
                  : "Monad launched with a non-trivial minimum gas price and charges based on gas limit rather than gas consumed. Spam transactions reserve large gas allocations but use only a fraction when they fail; charging for reserved gas directly targets this asymmetry."}
              </p>
            </div>
          </div>
        </div>

        {/* Marginal capacity chart */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mt-6">
          <h3 className="text-xl font-semibold tracking-tight mb-2">
            {simple ? "Why capping block size works" : "The favorable tradeoff"}
          </h3>
          <p className="text-sm text-text-secondary font-light mb-4 max-w-3xl">
            {simple
              ? "As blocks get bigger, each additional unit of space increasingly goes to spam rather than real users. By not adding that last stretch of capacity, designers can cut a lot of spam with very little impact on users."
              : "The share of each marginal unit of capacity going to users is strictly decreasing. Near the plateau, most additional capacity serves spam. Capping B_max before that point eliminates disproportionate spam at a small cost to user welfare."}
          </p>
          <MarginalCapacityChart params={params} Bmax={Bmax} />
          <p className="font-mono text-xs text-text-tertiary mt-2">
            User share of marginal block capacity as B_max grows. The curve
            drops toward zero near B_plat: each additional unit of capacity
            increasingly serves spam rather than users.
          </p>
        </div>
      </div>
    </section>
  );
}
