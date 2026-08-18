"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  storagePageIndex,
  storagePageKey,
  storageSlotKey,
} from "@/lib/mip8-storage";

type MobileTab = "code" | "pages" | "log";

const COLD_COST = 8100;
const WARM_COST = 100;

interface StorageOp {
  type: "SLOAD" | "SSTORE";
  slot: number;
  label: string;
  account?: string;
  locationLabel?: string;
  pageLabel?: string;
}

interface CodeLine {
  code: string;
  indent: number;
  op?: StorageOp;
  highlight?: "comment" | "keyword" | "fn" | "type" | "accent";
}

interface Example {
  name: string;
  account: string;
  description: string;
  lines: CodeLine[];
}

const EXAMPLES: Example[] = [
  {
    name: "Uniswap V2 swap()",
    account: "Pair",
    description: "", // translated via exampleDescriptions
    lines: [
      { code: "// UniswapV2Pair.sol", indent: 0, highlight: "comment" },
      { code: "function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external lock {", indent: 0, highlight: "fn" },
      { code: "// lock modifier", indent: 1, highlight: "comment" },
      {
        code: "require(unlocked == 1);  unlocked = 0;",
        indent: 1,
        op: { type: "SLOAD", slot: 12, label: "unlocked" },
      },
      { code: "", indent: 0 },
      {
        code: "(uint112 _reserve0, uint112 _reserve1,) = getReserves();",
        indent: 1,
        op: { type: "SLOAD", slot: 8, label: "reserves (packed)" },
      },
      { code: "require(amount0Out > 0 || amount1Out > 0);", indent: 1 },
      { code: "require(amount0Out < _reserve0 && amount1Out < _reserve1);", indent: 1 },
      { code: "", indent: 0 },
      {
        code: "address _token0 = token0;",
        indent: 1,
        op: { type: "SLOAD", slot: 6, label: "token0 address" },
      },
      {
        code: "address _token1 = token1;",
        indent: 1,
        op: { type: "SLOAD", slot: 7, label: "token1 address" },
      },
      {
        code: "// transfers/callback omitted; token balance pages start untouched",
        indent: 1,
        highlight: "comment",
      },
      {
        code: "uint balance0 = IERC20(_token0).balanceOf(address(this));",
        indent: 1,
        op: {
          type: "SLOAD",
          slot: 7823,
          label: "balanceOf(pair)",
          account: "Token 0",
          locationLabel: "hashed balance slot",
          pageLabel: "balance page",
        },
      },
      {
        code: "uint balance1 = IERC20(_token1).balanceOf(address(this));",
        indent: 1,
        op: {
          type: "SLOAD",
          slot: 7823,
          label: "balanceOf(pair)",
          account: "Token 1",
          locationLabel: "hashed balance slot",
          pageLabel: "balance page",
        },
      },
      { code: "", indent: 0 },
      { code: "// _update", indent: 1, highlight: "comment" },
      {
        code: "price0CumulativeLast += ...;",
        indent: 1,
        op: { type: "SSTORE", slot: 9, label: "price0CumulativeLast" },
      },
      {
        code: "price1CumulativeLast += ...;",
        indent: 1,
        op: { type: "SSTORE", slot: 10, label: "price1CumulativeLast" },
      },
      { code: "", indent: 0 },
      { code: "// end lock modifier", indent: 1, highlight: "comment" },
      {
        code: "unlocked = 1;",
        indent: 1,
        op: { type: "SSTORE", slot: 12, label: "unlocked (write-back)" },
      },
      { code: "}", indent: 0, highlight: "fn" },
    ],
  },
  {
    name: "ERC-1155 batch (page-aware)",
    account: "ERC-1155",
    description: "", // translated via exampleDescriptions
    lines: [
      { code: "// PageAwareERC1155.sol", indent: 0, highlight: "comment" },
      { code: "// Balances stored as contiguous array, not mapping", indent: 0, highlight: "comment" },
      { code: "uint256[128] private _balances;  // all in one page", indent: 0, highlight: "type" },
      { code: "", indent: 0 },
      { code: "function batchBalanceOf(uint256[] ids) external view returns (uint256[] memory) {", indent: 0, highlight: "fn" },
      { code: "uint256[] memory bals = new uint256[](ids.length);", indent: 1 },
      { code: "// Each iteration: SLOAD from contiguous array slot", indent: 1, highlight: "comment" },
      ...Array.from({ length: 20 }, (_, i) => ({
        code: `bals[${i}] = _balances[ids[${i}]];`,
        indent: 1,
        op: { type: "SLOAD" as const, slot: i, label: `balance[${i}]` },
      })),
      { code: "return bals;", indent: 1 },
      { code: "}", indent: 0, highlight: "fn" },
    ],
  },
  {
    name: "ERC-20 transfer()",
    account: "ERC-20",
    description: "", // translated via exampleDescriptions
    lines: [
      { code: "// OpenZeppelin ERC20.sol", indent: 0, highlight: "comment" },
      { code: "// slot 0: mapping(address => uint256) _balances", indent: 0, highlight: "comment" },
      { code: "// slot 1: mapping(address => mapping(...)) _allowances", indent: 0, highlight: "comment" },
      { code: "", indent: 0 },
      { code: "function transfer(address to, uint256 amount) public returns (bool) {", indent: 0, highlight: "fn" },
      {
        code: "uint256 fromBal = _balances[msg.sender];",
        indent: 1,
        op: { type: "SLOAD", slot: 7823, label: "balances[sender] (hashed)" },
      },
      { code: "require(fromBal >= amount);", indent: 1 },
      { code: "", indent: 0 },
      {
        code: "_balances[msg.sender] = fromBal - amount;",
        indent: 1,
        op: { type: "SSTORE", slot: 7823, label: "balances[sender] (write)" },
      },
      {
        code: "_balances[to] = _balances[to] + amount;",
        indent: 1,
        op: { type: "SLOAD", slot: 41502, label: "balances[to] (hashed)" },
      },
      {
        code: "// write to recipient balance",
        indent: 1,
        highlight: "comment",
      },
      {
        code: "_balances[to] = ...;",
        indent: 1,
        op: { type: "SSTORE", slot: 41502, label: "balances[to] (write)" },
      },
      { code: "", indent: 0 },
      { code: "emit Transfer(msg.sender, to, amount);", indent: 1 },
      { code: "return true;", indent: 1 },
      { code: "}", indent: 0, highlight: "fn" },
    ],
  },
];

export default function StepperSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [exampleIdx, setExampleIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [mobileTab, setMobileTab] = useState<MobileTab>("code");

  const example = EXAMPLES[exampleIdx];
  const exampleDescriptions = useMemo(() => [
    t("mip8.stepper.uniswapDesc"),
    t("mip8.stepper.erc1155Desc"),
    t("mip8.stepper.erc20Desc"),
  ], [t]);
  const exampleDescription = exampleDescriptions[exampleIdx];

  // Build the list of steps (lines that have storage ops)
  const opSteps = useMemo(
    () =>
      example.lines
        .map((line, idx) => ({ line, idx }))
        .filter((entry) => entry.line.op),
    [example]
  );

  // Compute page state up to currentStep
  const { touchedSlots, pageMap, currentGas, mip8Gas, opLog } = useMemo(() => {
    const touched = new Set<string>();
    const pages = new Map<
      string,
      {
        account: string;
        page: number;
        pageLabel?: string;
        slots: Set<number>;
      }
    >();
    let cGas = 0;
    let mGas = 0;
    const log: {
      label: string;
      type: string;
      account: string;
      slot: number;
      locationLabel?: string;
      coldCurrent: boolean;
      coldMip8: boolean;
      page: number;
    }[] = [];

    for (let i = 0; i <= currentStep && i < opSteps.length; i++) {
      const op = opSteps[i].line.op!;
      const account = op.account ?? example.account;
      const page = storagePageIndex(op.slot);
      const slotKey = storageSlotKey(account, op.slot);
      const pageKey = storagePageKey(account, op.slot);
      const isFirstTouchSlot = !touched.has(slotKey);
      const isFirstTouchPage = !pages.has(pageKey);

      if (!pages.has(pageKey)) {
        pages.set(pageKey, {
          account,
          page,
          pageLabel: op.pageLabel,
          slots: new Set(),
        });
      }

      if (isFirstTouchSlot) {
        touched.add(slotKey);
        // Monad (current): every new slot is cold
        cGas += COLD_COST;
        // MIP-8: cold only if page is new
        mGas += isFirstTouchPage ? COLD_COST : WARM_COST;
      }

      pages.get(pageKey)!.slots.add(op.slot);

      // Only log first-touch ops (re-accesses to the same slot are warm in both models)
      if (isFirstTouchSlot) {
        log.push({
          label: op.label,
          type: op.type,
          account,
          slot: op.slot,
          locationLabel: op.locationLabel,
          coldCurrent: true,
          coldMip8: isFirstTouchPage,
          page,
        });
      }
    }

    return {
      touchedSlots: touched,
      pageMap: pages,
      currentGas: cGas,
      mip8Gas: mGas,
      opLog: log,
    };
  }, [currentStep, example.account, opSteps]);

  const activeLineIdx = currentStep >= 0 && currentStep < opSteps.length
    ? opSteps[currentStep].idx
    : -1;

  const totalOps = opSteps.length;
  const finished = currentStep >= totalOps - 1 && currentStep >= 0;
  const savings =
    currentGas > 0
      ? Math.round(((currentGas - mip8Gas) / currentGas) * 100)
      : 0;
  const stepStatus =
    currentStep < 0
      ? `${example.name} is ready. ${totalOps} storage operations are available.`
      : `${example.name}, step ${currentStep + 1} of ${totalOps}. Current Monad gas is ${currentGas.toLocaleString()}; MIP-8 gas is ${mip8Gas.toLocaleString()}.`;

  const handleNext = useCallback(() => {
    if (currentStep < totalOps - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalOps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(-1);
  }, []);

  // Keyboard navigation — only when focus is within this section
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const focused = e.target as Element;
      if (focused.closest('button, a, select, [role="button"]')) return;
      if (!sectionRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "r" || e.key === "R") {
        handleReset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev, handleReset]);

  const handleSelectExample = (idx: number) => {
    setExampleIdx(idx);
    setCurrentStep(-1);
  };

  // Determine which pages to show
  const allPages = useMemo(() => {
    const pageSlots = new Map<
      string,
      {
        account: string;
        page: number;
        pageLabel?: string;
        slots: number[];
      }
    >();
    for (const step of opSteps) {
      const op = step.line.op!;
      const account = op.account ?? example.account;
      const page = storagePageIndex(op.slot);
      const pageKey = storagePageKey(account, op.slot);
      if (!pageSlots.has(pageKey)) {
        pageSlots.set(pageKey, {
          account,
          page,
          pageLabel: op.pageLabel,
          slots: [],
        });
      }
      if (!pageSlots.get(pageKey)!.slots.includes(op.slot)) {
        pageSlots.get(pageKey)!.slots.push(op.slot);
      }
    }
    return pageSlots;
  }, [example.account, opSteps]);

  const uniquePages = Array.from(allPages.entries());

  return (
    <section ref={sectionRef} className="py-24 px-6 bg-surface-elevated relative">
      <div
        ref={ref}
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
          {t("mip8.stepper.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-10">
          {t("mip8.stepper.desc")}
        </p>

        {/* Example picker */}
        <div
          className="flex flex-wrap gap-2 mb-8"
          role="group"
          aria-label="Code example picker"
        >
          {EXAMPLES.map((ex, i) => (
            <button
              key={ex.name}
              onClick={() => handleSelectExample(i)}
              type="button"
              aria-pressed={i === exampleIdx}
              className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
                i === exampleIdx
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface-elevated border-border hover:border-text-secondary"
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>

        <p className="text-sm text-text-tertiary font-light mb-6">
          {exampleDescription}
        </p>

        {/* Mobile tab switcher */}
        <div
          className="flex gap-1 mb-4 lg:hidden"
          role="group"
          aria-label="Stepper mobile view"
        >
          {(["code", "pages", "log"] as MobileTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              type="button"
              aria-pressed={mobileTab === tab}
              className={`font-mono text-xs px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                mobileTab === tab
                  ? "bg-text-primary text-surface"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface"
              }`}
            >
              {tab === "code" ? t("mip8.stepper.code") : tab === "pages" ? t("mip8.stepper.pages") : t("mip8.stepper.log")}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Code panel - 3 cols */}
          <div className={`lg:col-span-3 bg-surface-elevated rounded-xl border border-border overflow-hidden ${mobileTab !== "code" ? "hidden lg:block" : ""}`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="font-mono text-xs text-text-tertiary">
                {example.name}
              </p>
              <p className="font-mono text-xs text-text-tertiary">
                {opLog.length} {t("mip8.stepper.uniqueSlots")}
              </p>
            </div>
            <div className="p-4 overflow-x-auto max-h-[480px] overflow-y-auto">
              {example.lines.map((line, idx) => {
                const isActive = idx === activeLineIdx;
                const isPast = opSteps.some(
                  (s, si) => s.idx === idx && si <= currentStep && si >= 0
                );
                const hasOp = !!line.op;

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 px-2 py-0.5 rounded transition-all duration-200 ${
                      isActive
                        ? "bg-solution-accent/10 border-l-2 border-solution-accent"
                        : isPast && hasOp
                        ? "bg-solution-accent-light/20 border-l-2 border-solution-accent-light"
                        : "border-l-2 border-transparent"
                    }`}
                  >
                    {/* Line number */}
                    <span className="font-mono text-xs text-text-tertiary w-5 text-right shrink-0 select-none tabular-nums pt-0.5">
                      {idx + 1}
                    </span>
                    {/* Code */}
                    <pre
                      className={`font-mono text-xs whitespace-pre leading-relaxed ${
                        line.highlight === "comment"
                          ? "text-text-tertiary italic"
                          : line.highlight === "fn"
                          ? "text-text-primary font-semibold"
                          : line.highlight === "keyword"
                          ? "text-solution-accent"
                          : line.highlight === "type"
                          ? "text-solution-accent"
                          : "text-text-primary"
                      }`}
                      style={{ paddingLeft: `${line.indent * 16}px` }}
                    >
                      {line.code || " "}
                    </pre>
                    {/* Op badge */}
                    {hasOp && isPast && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`shrink-0 font-mono text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${
                          isActive
                            ? "bg-solution-accent text-white"
                            : "bg-solution-accent-light text-solution-accent"
                        }`}
                      >
                        {line.op!.type}
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            {/* Page grids */}
            <div className={`space-y-4 ${mobileTab !== "pages" ? "hidden lg:block" : ""}`}>
            {uniquePages.map(([pageKey, pageInfo]) => {
              const { account, page: pageNum, pageLabel } = pageInfo;
              const pageState = pageMap.get(pageKey);
              const pageSlots = pageState?.slots;
              const isWarmed = pageSlots !== undefined && pageSlots.size > 1;
              const pageBase = pageNum * 128;

              // Show first 64 slots (4 rows) for compact view
              const showSlots = 64;
              const cols = 16;

              return (
                <div
                  key={pageKey}
                  className={`bg-surface-elevated rounded-xl p-4 border-2 border-dashed transition-all duration-500 ${
                    isWarmed ? "border-solution-accent" : "border-border"
                  }`}
                  role="img"
                  aria-label={`Page ${pageNum}, slots ${pageBase} to ${pageBase + 127}. ${pageSlots?.size ?? 0} touched slot${(pageSlots?.size ?? 0) === 1 ? "" : "s"} so far.${isWarmed ? " This page is warm." : ""}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-mono text-xs text-text-tertiary">
                      {account} · {pageLabel ?? `page ${pageNum}`}
                      {!pageLabel && pageNum > 0 && (
                        <span className="text-text-tertiary">
                          {" "}(slots {pageBase}-{pageBase + 127})
                        </span>
                      )}
                    </p>
                    {isWarmed && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="font-mono text-xs px-2 py-0.5 rounded-full bg-solution-accent text-white"
                      >
                        WARM
                      </motion.span>
                    )}
                  </div>
                  <div
                    className="grid gap-[2px]"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    }}
                  >
                    {Array.from({ length: showSlots }, (_, i) => {
                      const absSlot = pageBase + i;
                      const isTouched = touchedSlots.has(
                        storageSlotKey(account, absSlot),
                      );
                      const isTarget = pageInfo.slots.includes(absSlot);
                      const isCurrentOp =
                        currentStep >= 0 &&
                        currentStep < opSteps.length &&
                        (opSteps[currentStep].line.op?.account ?? example.account) === account &&
                        opSteps[currentStep].line.op?.slot === absSlot;

                      let bg = "bg-[#e8e2da]";
                      if (isCurrentOp) bg = "bg-solution-accent animate-pulse";
                      else if (isTouched) bg = "bg-solution-accent";
                      else if (isTarget && isWarmed)
                        bg = "bg-solution-accent-light";
                      else if (isWarmed) bg = "bg-solution-accent-light/50";

                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-[2px] transition-colors duration-200 ${bg}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Op log */}
            <div className={`bg-surface-elevated rounded-xl border border-border p-4 max-h-[180px] overflow-y-auto ${mobileTab !== "log" ? "hidden lg:block" : ""}`}>
              <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-2">
                {t("mip8.stepper.accessLog")}
              </p>
              {opLog.length === 0 && (
                <p className="font-mono text-xs text-text-tertiary">
                  {t("mip8.stepper.clickNext")}
                </p>
              )}
              {opLog.map((entry, i) => (
                <motion.div
                  key={`${i}-${entry.account}-${entry.slot}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`font-mono text-[11px] py-0.5 ${
                    i === opLog.length - 1
                      ? "text-solution-accent font-semibold"
                      : "text-text-secondary"
                  }`}
                >
                  <span className="text-text-tertiary">{entry.type}</span>{" "}
                  {entry.account} · {entry.locationLabel ?? `slot ${entry.slot}`}{" "}
                  <span className="text-text-tertiary">
                    ({entry.label})
                  </span>{" "}
                  {entry.coldMip8 ? (
                    <span className="text-problem-accent">cold {COLD_COST}</span>
                  ) : (
                    <span className="text-solution-accent">warm {WARM_COST}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={handlePrev}
            disabled={currentStep <= 0}
            type="button"
            aria-label="Previous storage operation"
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
              currentStep <= 0
                ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
                : "bg-surface-elevated border-border hover:border-text-secondary cursor-pointer"
            }`}
          >
            {t("mip8.stepper.prev")}
          </button>
          <button
            onClick={handleNext}
            disabled={finished}
            type="button"
            aria-label={currentStep < 0 ? "Start stepping through storage operations" : "Next storage operation"}
            className={`font-mono text-xs px-4 py-2.5 rounded-lg border transition-all ${
              finished
                ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
                : "bg-solution-accent text-white border-solution-accent hover:bg-solution-accent/90 cursor-pointer"
            }`}
          >
            {currentStep < 0 ? t("mip8.stepper.start") : t("mip8.stepper.next")}
          </button>
          {currentStep >= 0 && (
            <button
              onClick={handleReset}
              type="button"
              aria-label="Reset storage operation stepper"
              className="font-mono text-xs px-3 py-2.5 rounded-lg text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
            >
              {t("mip8.stepper.reset")}
            </button>
          )}
          <p className="hidden sm:block font-mono text-xs text-text-tertiary/50">
            {t("mip8.stepper.keys")}
          </p>
          <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-start sm:justify-end gap-4">
            <p className="sr-only" aria-live="polite">
              {stepStatus}
            </p>
            <AnimatePresence mode="wait">
              {currentStep >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="text-right">
                    <p className="font-mono text-xs text-text-tertiary">Monad</p>
                    <p className="font-mono text-sm font-semibold text-problem-accent tabular-nums">
                      {currentGas.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-text-tertiary">MIP-8</p>
                    <p className="font-mono text-sm font-semibold text-solution-accent tabular-nums">
                      {mip8Gas.toLocaleString()}
                    </p>
                  </div>
                  {savings > 0 && (
                    <div className="px-2 py-1 rounded-md bg-solution-accent-light">
                      <p className="font-mono text-xs font-semibold text-solution-accent">
                        {savings}%
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Final summary */}
        {finished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-elevated rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-xs text-text-tertiary">
                {t("mip8.stepper.totalGasFor")} {example.name}
              </p>
              <p className="font-mono text-lg font-semibold text-solution-accent">
                {savings > 0
                  ? `${savings}${t("mip8.stepper.cheaperWithMip8")}`
                  : t("mip8.stepper.noChangeWithMip8")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-mono text-xs text-text-tertiary">
                  {t("mip8.gasCalc.monadCurrent")}: {uniquePages.length} page{uniquePages.length > 1 ? "s" : ""}, {t("mip8.stepper.allSlotsCold")}
                </p>
                <p className="font-mono text-sm text-problem-accent font-semibold">
                  {currentGas.toLocaleString()} gas
                </p>
              </div>
              <div>
                <p className="font-mono text-xs text-text-tertiary">
                  MIP-8: {pageMap.size} page{pageMap.size > 1 ? "s" : ""} {t("mip8.stepper.cold")}, {t("mip8.stepper.restWarm")}
                </p>
                <p className="font-mono text-sm text-solution-accent font-semibold">
                  {mip8Gas.toLocaleString()} gas
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
