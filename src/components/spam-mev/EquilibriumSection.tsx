"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { useInView } from "../useInView";
import { useUrlState } from "../useUrlState";
import { useExplainMode } from "./ExplainModeContext";
import Hint from "./Hint";
import { computeEquilibrium, computeSweep, DEFAULTS } from "./model";
import type { ModelParams } from "./model";
import { numberParam } from "@/lib/url-state";

const MAX_BMAX = 2000;
const BMAX_STEP = 10;

const BMAX_URL_PARAM = numberParam({
  min: 0,
  max: MAX_BMAX,
  step: BMAX_STEP,
  fallback: 1200,
});

const REGIME_PRESETS_TECHNICAL = [
  { label: "No spam", Bmax: 350 },
  { label: "Congested", Bmax: 900 },
  { label: "Near plateau", Bmax: 1250 },
  { label: "Slack", Bmax: 1700 },
];

const REGIME_PRESETS_SIMPLE = [
  { label: "Tiny blocks", Bmax: 350 },
  { label: "Medium blocks", Bmax: 900 },
  { label: "Large blocks", Bmax: 1250 },
  { label: "Huge blocks", Bmax: 1700 },
];

function formatNum(n: number, decimals = 0): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(decimals);
}

/** SVG sweep chart: user gas (blue) + spam gas (red) stacked areas */
function SweepChart({
  sweep,
  currentBmax,
  params,
  label,
}: {
  sweep: ReturnType<typeof computeSweep>;
  currentBmax: number;
  params: ModelParams;
  label: string;
}) {
  const W = 580;
  const H = 240;
  const padL = 48;
  const padR = 8;
  const padT = 12;
  const padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxGas = Math.max(
    params.D0 * 1.05,
    ...sweep.map((s) => s.Qu + s.spamGas)
  );

  const x = (bmax: number) => padL + (bmax / MAX_BMAX) * chartW;
  const y = (gas: number) => padT + chartH - (gas / maxGas) * chartH;

  // Build area paths
  const userAreaPath = useMemo(() => {
    const forward = sweep
      .map((s, i) => `${i === 0 ? "M" : "L"}${x(i * 10)},${y(s.Qu)}`)
      .join(" ");
    const back = `L${x(MAX_BMAX)},${y(0)} L${x(0)},${y(0)} Z`;
    return forward + " " + back;
  }, [sweep]);

  const spamAreaPath = useMemo(() => {
    const forward = sweep
      .map(
        (s, i) =>
          `${i === 0 ? "M" : "L"}${x(i * 10)},${y(s.Qu + s.spamGas)}`
      )
      .join(" ");
    const back = [...sweep]
      .reverse()
      .map((s, i) => `L${x((sweep.length - 1 - i) * 10)},${y(s.Qu)}`)
      .join(" ");
    return forward + " " + back + " Z";
  }, [sweep]);

  // Regime boundaries
  const BnoSpam = sweep[0]?.BnoSpam ?? 0;
  const Bplat = sweep[0]?.Bplat ?? 0;

  // Current point
  const eq = computeEquilibrium(currentBmax, params);
  const cx = x(currentBmax);
  const cyUser = y(eq.Qu);
  const cyTotal = y(eq.Qu + eq.spamGas);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ maxHeight: 280 }}
      role="img"
      aria-label={label}
    >
      {/* Regime background bands */}
      <rect
        x={padL}
        y={padT}
        width={x(BnoSpam) - padL}
        height={chartH}
        fill="#f0f7f5"
        opacity={0.5}
      />
      <rect
        x={x(BnoSpam)}
        y={padT}
        width={x(Math.min(Bplat, MAX_BMAX)) - x(BnoSpam)}
        height={chartH}
        fill="#fdf6ef"
        opacity={0.4}
      />
      <rect
        x={x(Math.min(Bplat, MAX_BMAX))}
        y={padT}
        width={x(MAX_BMAX) - x(Math.min(Bplat, MAX_BMAX))}
        height={chartH}
        fill="#f8f6f3"
        opacity={0.5}
      />

      {/* Regime labels */}
      <text
        x={(padL + x(BnoSpam)) / 2}
        y={padT + 14}
        textAnchor="middle"
        className="font-mono"
        fontSize={9}
        fill="#2a7d6a"
        opacity={0.7}
      >
        no spam
      </text>
      <text
        x={(x(BnoSpam) + x(Math.min(Bplat, MAX_BMAX))) / 2}
        y={padT + 14}
        textAnchor="middle"
        className="font-mono"
        fontSize={9}
        fill="#c4653a"
        opacity={0.7}
      >
        congested
      </text>
      <text
        x={
          (x(Math.min(Bplat, MAX_BMAX)) + x(MAX_BMAX)) / 2
        }
        y={padT + 14}
        textAnchor="middle"
        className="font-mono"
        fontSize={9}
        fill="#9b9084"
        opacity={0.7}
      >
        slack
      </text>

      {/* User area */}
      <path d={userAreaPath} fill="#3b7dd8" opacity={0.25} />

      {/* Spam area (stacked above user) */}
      <path d={spamAreaPath} fill="#c4653a" opacity={0.3} />

      {/* User gas line */}
      <path
        d={sweep
          .map(
            (s, i) => `${i === 0 ? "M" : "L"}${x(i * 10)},${y(s.Qu)}`
          )
          .join(" ")}
        fill="none"
        stroke="#3b7dd8"
        strokeWidth={1.5}
      />

      {/* Total gas line (user + spam) */}
      <path
        d={sweep
          .map(
            (s, i) =>
              `${i === 0 ? "M" : "L"}${x(i * 10)},${y(s.Qu + s.spamGas)}`
          )
          .join(" ")}
        fill="none"
        stroke="#c4653a"
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />

      {/* Bplat marker */}
      {Bplat <= MAX_BMAX && (
        <line
          x1={x(Bplat)}
          y1={padT}
          x2={x(Bplat)}
          y2={padT + chartH}
          stroke="#9b9084"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}

      {/* Current Bmax indicator */}
      <line
        x1={cx}
        y1={padT}
        x2={cx}
        y2={padT + chartH}
        stroke="#1a1714"
        strokeWidth={1}
        opacity={0.4}
      />
      <circle cx={cx} cy={cyUser} r={4} fill="#3b7dd8" />
      <circle cx={cx} cy={cyTotal} r={4} fill="#c4653a" />

      {/* Axes */}
      <line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#e2ddd7"
        strokeWidth={1}
      />
      <line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + chartH}
        stroke="#e2ddd7"
        strokeWidth={1}
      />

      {/* Axis labels */}
      <text
        x={padL + chartW / 2}
        y={H - 4}
        textAnchor="middle"
        className="font-mono"
        fontSize={10}
        fill="#9b9084"
      >
        B_max (block capacity)
      </text>
      <text
        x={14}
        y={padT + chartH / 2}
        textAnchor="middle"
        className="font-mono"
        fontSize={10}
        fill="#9b9084"
        transform={`rotate(-90, 14, ${padT + chartH / 2})`}
      >
        gas
      </text>

      {/* Tick marks */}
      {[0, 500, 1000, 1500, 2000].map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            y1={padT + chartH}
            x2={x(tick)}
            y2={padT + chartH + 4}
            stroke="#9b9084"
          />
          <text
            x={x(tick)}
            y={padT + chartH + 16}
            textAnchor="middle"
            className="font-mono"
            fontSize={9}
            fill="#9b9084"
          >
            {tick}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Plain-language narrative for simple mode, replacing raw metrics */
function NarrativeCallout({
  eq,
  Bmax,
}: {
  eq: ReturnType<typeof computeEquilibrium>;
  Bmax: number;
}) {
  const welfareLoss =
    eq.userWelfareNoSpam > 0
      ? ((eq.userWelfareNoSpam - eq.userWelfare) / eq.userWelfareNoSpam) * 100
      : 0;

  let headline: string;
  let body: string;
  let color: string;

  if (eq.regime === "no-spam") {
    headline = "No spam at this block size";
    body =
      "The block is small enough that transaction fees stay high. Spam bots can't afford to play because every failed probe costs more than they'd make. All block space goes to real users.";
    color = "#2a7d6a";
  } else if (eq.regime === "slack") {
    headline = "Block has room to spare";
    body = `The block is bigger than total demand. Spam has settled at its maximum level (${Math.round(eq.spamShare * 100)}% of used space), but it's no longer crowding out real users. Extra capacity sits idle. Making the block even bigger won't change anything.`;
    color = "#9b9084";
  } else {
    // congested
    const severity =
      eq.spamShare > 0.25
        ? "heavy"
        : eq.spamShare > 0.1
          ? "moderate"
          : "light";

    if (severity === "heavy") {
      headline = "Spam is eating the block";
      body = `Spam takes up ${Math.round(eq.spamShare * 100)}% of the block. Real users are being crowded out and paying ${welfareLoss > 0 ? `${Math.round(welfareLoss)}% more than they would` : "significantly more than they should"} without spam. Most of the block space that was meant for users is being wasted on failed probes.`;
    } else if (severity === "moderate") {
      headline = "Spam is competing with users";
      body = `About ${Math.round(eq.spamShare * 100)}% of the block is spam. Users are paying somewhat higher fees because spam is taking up space they need. Each additional unit of block space increasingly goes to spam rather than users.`;
    } else {
      headline = "Spam is starting to appear";
      body = `Spam has entered the block at ${Math.round(eq.spamShare * 100)}% of total gas. The impact on users is still small, but as the block grows larger, spam will claim an increasing share of each additional unit of capacity.`;
    }
    color = "#c4653a";
  }

  return (
    <motion.div
      key={eq.regime + Math.round(eq.spamShare * 10)}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      className="rounded-xl border-2 p-5 mb-8"
      style={{ borderColor: color + "40", backgroundColor: color + "08" }}
    >
      <p className="font-semibold text-lg mb-2" style={{ color }}>
        {headline}
      </p>
      <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
      <div className="flex items-center gap-6 mt-4 pt-3 border-t" style={{ borderColor: color + "20" }}>
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums" style={{ color }}>
            {Math.round(eq.spamShare * 100)}%
          </p>
          <p className="font-mono text-[10px] text-text-tertiary">spam</p>
        </div>
        {welfareLoss > 1 && (
          <div>
            <p className="font-mono text-2xl font-semibold tabular-nums text-problem-accent">
              &minus;{Math.round(welfareLoss)}%
            </p>
            <p className="font-mono text-[10px] text-text-tertiary">
              user benefit lost
            </p>
          </div>
        )}
        <div>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {Math.round(eq.S)}
          </p>
          <p className="font-mono text-[10px] text-text-tertiary">
            spam txs in each block
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function EquilibriumSection() {
  const { ref, isVisible } = useInView(0.1);
  const { mode } = useExplainMode();
  const simple = mode === "simple";
  const [Bmax, setBmax] = useUrlState("eq", BMAX_URL_PARAM);
  const params = DEFAULTS;

  const eq = computeEquilibrium(Bmax, params);
  const sweep = useMemo(() => computeSweep(params, MAX_BMAX), [params]);

  const totalIncluded = eq.Qu + eq.spamGas;
  const idle = Math.max(0, Bmax - totalIncluded);

  const presets = simple ? REGIME_PRESETS_SIMPLE : REGIME_PRESETS_TECHNICAL;

  // Bar widths as percentages of Bmax
  const userPct = Bmax > 0 ? (eq.Qu / MAX_BMAX) * 100 : 0;
  const spamPct = Bmax > 0 ? (eq.spamGas / MAX_BMAX) * 100 : 0;
  const capacityPct = (Bmax / MAX_BMAX) * 100;

  const regimeLabel = simple
    ? eq.regime === "no-spam"
      ? "No spam - fees keep bots out"
      : eq.regime === "congested"
        ? "Congested - spam crowds users"
        : "Slack - block has room to spare"
    : eq.regime === "no-spam"
      ? "No Spam"
      : eq.regime === "congested"
        ? "Congested"
        : "Slack";

  const regimeColor =
    eq.regime === "no-spam"
      ? "#2a7d6a"
      : eq.regime === "congested"
        ? "#c4653a"
        : "#9b9084";
  const bmaxValueText = `${Bmax.toLocaleString()} gas units of block capacity. Regime: ${regimeLabel}. User gas ${Math.round(eq.Qu).toLocaleString()}, spam gas ${Math.round(eq.spamGas).toLocaleString()}${idle > 10 ? `, idle capacity ${Math.round(idle).toLocaleString()}` : ""}.`;
  const compositionSummary = `Block composition: ${regimeLabel}. User gas ${Math.round(eq.Qu).toLocaleString()}, spam gas ${Math.round(eq.spamGas).toLocaleString()}${idle > 10 ? `, idle capacity ${Math.round(idle).toLocaleString()}` : ""}.`;
  const sweepSummary = `Spam equilibrium chart across block sizes. Current block capacity is ${Bmax.toLocaleString()}; user gas is ${Math.round(eq.Qu).toLocaleString()}, spam gas is ${Math.round(eq.spamGas).toLocaleString()}, and the plateau is ${Math.round(eq.Bplat).toLocaleString()}.`;

  return (
    <section ref={ref} className="py-24 px-6 bg-surface relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {simple ? "How spam fills up blocks" : "The spam equilibrium"}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {simple
            ? "As blocks get bigger, spam takes a larger share of each new unit of space. Drag the slider to make blocks bigger and watch spam grow."
            : "As block capacity grows, spam enters and claims an increasing share of each additional unit. The model identifies three regimes depending on how capacity compares to demand."}
        </p>
        {!simple && (
          <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-2">
            Parameters use the paper&apos;s defaults: D&#8320; = {params.D0}, &#946; ={" "}
            {params.beta}, s = {params.s}, r&#8320; = {params.r0}, g_min ={" "}
            {params.gmin}.
          </p>
        )}
        <div className="mb-10" />

        {/* Slider + Presets */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label
              htmlFor="bmax-range"
              className="font-mono text-xs text-text-tertiary"
            >
              {simple ? "Block size" : <Hint term="b_max">Block capacity (B_max)</Hint>}
            </label>
            <motion.p
              key={Bmax}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              className="font-mono text-2xl font-semibold text-text-primary tabular-nums"
            >
              {Bmax.toLocaleString()}
            </motion.p>
          </div>
          <input
            id="bmax-range"
            type="range"
            min={0}
            max={MAX_BMAX}
            step={BMAX_STEP}
            value={Bmax}
            onChange={(e) => setBmax(Number(e.target.value))}
            aria-valuetext={bmaxValueText}
            aria-describedby="bmax-summary"
            className="w-full accent-text-primary cursor-pointer"
          />
          <div className="flex justify-between font-mono text-xs text-text-tertiary mt-1">
            <span>0</span>
            <span>{MAX_BMAX.toLocaleString()}</span>
          </div>
          <p id="bmax-summary" className="sr-only" aria-live="polite">
            {bmaxValueText}
          </p>

          {/* Preset buttons */}
          <div
            className="flex flex-wrap gap-2 mt-4"
            role="group"
            aria-label="Block capacity presets"
          >
            {presets.map((preset) => {
              const isActive = Math.abs(Bmax - preset.Bmax) <= 50;
              return (
                <button
                  key={preset.label}
                  onClick={() => setBmax(preset.Bmax)}
                  type="button"
                  aria-pressed={isActive}
                  className={`font-mono text-xs px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                    isActive
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface border-border hover:border-text-secondary"
                  }`}
                >
                  {preset.label}
                  <span className="text-text-tertiary ml-1.5">
                    {preset.Bmax}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Block composition bar */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs text-text-tertiary">
              Block composition
            </p>
            <div
              className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
              style={{
                color: regimeColor,
                backgroundColor: regimeColor + "18",
              }}
            >
              {regimeLabel}
            </div>
          </div>

          {/* Stacked bar */}
          <div
            className="relative h-10 bg-border/30 rounded-lg overflow-hidden"
            role="img"
            aria-label={compositionSummary}
          >
            {/* Capacity boundary */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-border/10 rounded-lg"
              style={{ width: `${capacityPct}%` }}
            />

            {/* User gas */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-l-lg"
              style={{ backgroundColor: "#3b7dd8" }}
              animate={{ width: `${userPct}%` }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Spam gas */}
            <motion.div
              className="absolute top-0 bottom-0"
              style={{ backgroundColor: "#c4653a" }}
              animate={{
                left: `${userPct}%`,
                width: `${spamPct}%`,
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Labels on bar */}
            {eq.Qu > 100 && (
              <motion.span
                className="absolute top-1/2 -translate-y-1/2 font-mono text-[10px] text-white font-semibold pointer-events-none"
                animate={{ left: `${Math.max(1, userPct / 2)}%` }}
                style={{ transform: "translate(-50%, -50%)" }}
              >
                Users {Math.round(eq.Qu)}
              </motion.span>
            )}
            {eq.spamGas > 40 && (
              <motion.span
                className="absolute top-1/2 -translate-y-1/2 font-mono text-[10px] text-white font-semibold pointer-events-none"
                animate={{
                  left: `${userPct + spamPct / 2}%`,
                }}
                style={{ transform: "translate(-50%, -50%)" }}
              >
                Spam {Math.round(eq.spamGas)}
              </motion.span>
            )}
          </div>

          {/* Legend + numbers */}
          <div className="flex items-center gap-4 mt-3 font-mono text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-full inline-block bg-[#3b7dd8]" />
              User gas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-full inline-block bg-[#c4653a]" />
              Spam gas
            </span>
            {idle > 10 && (
              <span className="ml-auto">
                {Math.round(idle)} idle
              </span>
            )}
          </div>
        </div>

        {/* Metrics: narrative in simple mode, raw numbers in technical */}
        {simple ? (
          <NarrativeCallout eq={eq} Bmax={Bmax} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-surface-elevated rounded-lg border border-border p-4">
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                <Hint term="clearing price">Gas price</Hint>
              </p>
              <motion.p
                key={`g-${Math.round(eq.g * 10)}`}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="font-mono text-xl font-semibold tabular-nums"
              >
                {eq.g.toFixed(1)}
              </motion.p>
            </div>
            <div className="bg-surface-elevated rounded-lg border border-border p-4">
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                <Hint term="spam share">Spam share</Hint>
              </p>
              <motion.p
                key={`share-${Math.round(eq.spamShare * 100)}`}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="font-mono text-xl font-semibold tabular-nums"
                style={{
                  color:
                    eq.spamShare > 0.2
                      ? "#c4653a"
                      : eq.spamShare > 0
                        ? "#a8856e"
                        : "#2a7d6a",
                }}
              >
                {(eq.spamShare * 100).toFixed(1)}%
              </motion.p>
            </div>
            <div className="bg-surface-elevated rounded-lg border border-border p-4">
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                Spam txs
              </p>
              <motion.p
                key={`S-${Math.round(eq.S * 10)}`}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="font-mono text-xl font-semibold tabular-nums"
              >
                {eq.S.toFixed(1)}
              </motion.p>
            </div>
            <div className="bg-surface-elevated rounded-lg border border-border p-4">
              <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider mb-2">
                <Hint term="user welfare">User welfare</Hint>
              </p>
              <motion.p
                key={`w-${Math.round(eq.userWelfare)}`}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                className="font-mono text-xl font-semibold tabular-nums"
              >
                {formatNum(eq.userWelfare)}
              </motion.p>
              {eq.userWelfareNoSpam > eq.userWelfare + 1 && (
                <p className="font-mono text-[10px] text-problem-accent mt-1">
                  &minus;
                  {(
                    ((eq.userWelfareNoSpam - eq.userWelfare) /
                      eq.userWelfareNoSpam) *
                    100
                  ).toFixed(0)}
                  % vs no-spam
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sweep chart */}
        <div className="bg-surface-elevated rounded-xl border border-border p-6">
          <p className="font-mono text-xs text-text-tertiary mb-2">
            {simple ? "The big picture" : "Spam equilibrium across all block sizes"}
          </p>
          <p className="text-sm text-text-secondary font-light mb-4">
            {simple
              ? "Each column shows how a block of that size splits between real users (blue) and spam (red). Notice how the red area grows faster than the blue as blocks get bigger."
              : `Blue area shows user gas, red area shows spam gas stacked on top. As capacity grows beyond the congested regime, added capacity increasingly serves spam until the plateau (B_plat = ${Math.round(eq.Bplat)}) where both level off.`}
          </p>
          <SweepChart
            sweep={sweep}
            currentBmax={Bmax}
            params={params}
            label={sweepSummary}
          />
          <div className="flex items-center gap-4 mt-3 font-mono text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block bg-[#3b7dd8]" />
              User gas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-0.5 inline-block bg-[#c4653a]" style={{ borderTop: "1px dashed #c4653a" }} />
              Total included gas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block bg-[#9b9084]" style={{ borderTop: "1px dashed #9b9084" }} />
              B_plat
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
