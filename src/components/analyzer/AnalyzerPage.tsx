"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  analyzeSource,
  analyzeGithub,
  traceFunction,
  groupByPage,
  calculateGas,
  type StorageVar,
  type CompilationResult,
  type ContractResult,
  type AbiFunction,
  type TraceResult,
} from "./solc-utils";

const SAMPLE_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LendingPool {
    address public owner;
    address public guardian;
    bool public paused;
    uint256 public totalDeposits;
    uint256 public totalBorrows;
    uint256 public reserveFactor;
    uint256 public liquidationBonus;
    uint256 public borrowIndex;
    uint256 public supplyIndex;
    uint256 public lastUpdateBlock;
    uint256 public interestRate;
    uint256 public utilizationRate;
    address public oracle;
    address public interestModel;
    uint256 public maxLTV;
    uint256 public minDebt;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrows;
    mapping(address => uint256) public collateral;
}`;

type Tab = "paste" | "github";

const POPULAR_REPOS = [
  { name: "Uniswap V2", url: "https://github.com/Uniswap/v2-core" },
  { name: "Uniswap V3", url: "https://github.com/Uniswap/v3-core" },
  { name: "solmate", url: "https://github.com/transmissions11/solmate" },
  { name: "OpenZeppelin", url: "https://github.com/OpenZeppelin/openzeppelin-contracts" },
];

interface ProgressStep {
  label: string;
  pct: number;
  delayMs: number; // time before advancing to next step
}

const ANALYZE_STEPS: ProgressStep[] = [
  { label: "Sending to backend", pct: 5, delayMs: 800 },
  { label: "Cloning repository", pct: 15, delayMs: 4000 },
  { label: "Compiling with Foundry", pct: 40, delayMs: 8000 },
  { label: "Extracting storage layouts", pct: 75, delayMs: 3000 },
  { label: "Processing results", pct: 90, delayMs: 5000 },
];

const ANALYZE_PASTE_STEPS: ProgressStep[] = [
  { label: "Sending to backend", pct: 5, delayMs: 800 },
  { label: "Initializing Forge project", pct: 20, delayMs: 2000 },
  { label: "Compiling with Foundry", pct: 50, delayMs: 5000 },
  { label: "Extracting storage layouts", pct: 80, delayMs: 2000 },
  { label: "Processing results", pct: 92, delayMs: 5000 },
];

const TRACE_STEPS: ProgressStep[] = [
  { label: "Building project", pct: 5, delayMs: 1500 },
  { label: "Compiling with Foundry", pct: 20, delayMs: 6000 },
  { label: "Starting local EVM", pct: 45, delayMs: 2000 },
  { label: "Deploying contract", pct: 60, delayMs: 2000 },
  { label: "Executing function", pct: 72, delayMs: 1500 },
  { label: "Tracing SLOAD/SSTORE opcodes", pct: 85, delayMs: 3000 },
  { label: "Parsing trace results", pct: 95, delayMs: 5000 },
];

function useProgress(steps: ProgressStep[]) {
  const [stepIdx, setStepIdx] = useState(-1); // -1 = not running
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setStepIdx(0);
    setDone(false);
  }, []);

  const finish = useCallback(() => {
    setDone(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const reset = useCallback(() => {
    setStepIdx(-1);
    setDone(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Auto-advance through steps
  useEffect(() => {
    if (stepIdx < 0 || done) return;
    if (stepIdx >= steps.length - 1) return; // stay on last step until finish()

    timerRef.current = setTimeout(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, steps[stepIdx].delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIdx, done, steps]);

  const active = stepIdx >= 0 && !done;
  const current = stepIdx >= 0 ? steps[Math.min(stepIdx, steps.length - 1)] : null;
  const pct = done ? 100 : current?.pct ?? 0;

  return { start, finish, reset, active, pct, label: current?.label ?? "", stepIdx };
}

function isMapping(type: string): boolean {
  return type.startsWith("mapping(");
}

export default function AnalyzerPage() {
  const searchParams = useSearchParams();
  const queryInput = searchParams.get("q") || "";

  const [tab, setTab] = useState<Tab>(
    queryInput.includes("github.com") ? "github" : "paste"
  );
  const [source, setSource] = useState(
    queryInput && !queryInput.includes("github.com") ? queryInput : SAMPLE_SOURCE
  );
  const [githubUrl, setGithubUrl] = useState(
    queryInput.includes("github.com") ? queryInput : ""
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [selectedContract, setSelectedContract] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [autoAnalyzed, setAutoAnalyzed] = useState(false);

  // Trace state
  const [selectedFunction, setSelectedFunction] = useState<string>("");
  const [fnArgs, setFnArgs] = useState<string[]>([]);
  const [constructorArgs, setConstructorArgs] = useState<string[]>([]);
  const [tracing, setTracing] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceResult | null>(null);
  const [traceMode, setTraceMode] = useState(false); // true = showing traced slots

  // Progress tracking
  const analyzeProgress = useProgress(
    tab === "github" ? ANALYZE_STEPS : ANALYZE_PASTE_STEPS
  );
  const traceProgress = useProgress(TRACE_STEPS);

  const contract: ContractResult | null =
    result?.contracts?.[selectedContract] ?? null;

  // Get callable functions from ABI (exclude view/pure for meaningful traces)
  const functions = useMemo(() => {
    if (!contract?.abi) return [];
    return contract.abi.filter(
      (f): f is AbiFunction & { name: string } =>
        f.type === "function" && !!f.name
    );
  }, [contract]);

  const selectedFnAbi = useMemo(
    () => functions.find((f) => f.name === selectedFunction),
    [functions, selectedFunction]
  );

  const constructorAbi = useMemo(() => {
    if (!contract?.abi) return null;
    return contract.abi.find((f) => f.type === "constructor") ?? null;
  }, [contract]);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setSelectedSlots(new Set());
    setSelectedContract(0);
    analyzeProgress.start();
    try {
      const res =
        tab === "github" && githubUrl.trim()
          ? await analyzeGithub(githubUrl.trim())
          : await analyzeSource(source);
      setResult(res);
      // Auto-select non-mapping vars of the first contract with storage
      const first = res.contracts?.find((c) => c.storageLayout.length > 0);
      if (first) {
        const idx = res.contracts!.indexOf(first);
        setSelectedContract(idx);
        setSelectedSlots(
          new Set(
            first.storageLayout
              .filter((v) => !isMapping(v.type))
              .map((v) => v.slot)
          )
        );
      }
    } catch (e) {
      setResult({
        success: false,
        errors: [e instanceof Error ? e.message : "Failed to connect to analyzer service"],
      });
    }
    analyzeProgress.finish();
    setLoading(false);
  }, [tab, source, githubUrl, analyzeProgress]);

  const handleQuickRepo = useCallback(
    async (url: string) => {
      setTab("github");
      setGithubUrl(url);
      setLoading(true);
      setResult(null);
      setSelectedSlots(new Set());
      setSelectedContract(0);
      analyzeProgress.start();
      try {
        const res = await analyzeGithub(url);
        setResult(res);
        const first = res.contracts?.find((c) => c.storageLayout.length > 0);
        if (first) {
          const idx = res.contracts!.indexOf(first);
          setSelectedContract(idx);
          setSelectedSlots(
            new Set(
              first.storageLayout
                .filter((v) => !isMapping(v.type))
                .map((v) => v.slot)
            )
          );
        }
      } catch (e) {
        setResult({
          success: false,
          errors: [
            e instanceof Error
              ? e.message
              : "Failed to connect to analyzer service",
          ],
        });
      }
      analyzeProgress.finish();
      setLoading(false);
    },
    [analyzeProgress, setTab]
  );

  // Auto-analyze when navigated with ?q= param
  useEffect(() => {
    if (queryInput && !autoAnalyzed) {
      setTimeout(() => {
        setAutoAnalyzed(true);
        handleAnalyze();
      }, 0);
    }
  }, [queryInput, autoAnalyzed, handleAnalyze]);

  const handleSelectContract = useCallback(
    (idx: number) => {
      setSelectedContract(idx);
      setTraceResult(null);
      setTraceMode(false);
      setSelectedFunction("");
      setFnArgs([]);
      setConstructorArgs([]);
      const c = result?.contracts?.[idx];
      if (c) {
        setSelectedSlots(
          new Set(
            c.storageLayout
              .filter((v) => !isMapping(v.type))
              .map((v) => v.slot)
          )
        );
      }
    },
    [result]
  );

  const handleTrace = useCallback(async () => {
    if (!contract || !selectedFunction) return;
    setTracing(true);
    setTraceResult(null);
    traceProgress.start();

    // Build the function signature: "name(type1,type2)"
    const fnAbi = functions.find((f) => f.name === selectedFunction);
    if (!fnAbi) return;
    const sig = `${fnAbi.name}(${fnAbi.inputs.map((i) => i.type).join(",")})`;

    try {
      const res = await traceFunction({
        source: tab === "paste" ? source : undefined,
        githubUrl: tab === "github" ? githubUrl.trim() : undefined,
        contractName: contract.name,
        functionSig: sig,
        args: fnArgs.filter((a) => a.trim() !== ""),
        constructorArgs: constructorArgs.filter((a) => a.trim() !== ""),
      });

      setTraceResult(res);

      // If trace succeeded, auto-select the traced slots
      if (res.success && res.trace) {
        setSelectedSlots(new Set(res.trace.uniqueSlots));
        setTraceMode(true);
      }
    } catch (e) {
      setTraceResult({
        success: false,
        errors: [
          e instanceof Error ? e.message : "Failed to connect to trace service",
        ],
      });
    }
    traceProgress.finish();
    setTracing(false);
  }, [
    contract,
    selectedFunction,
    functions,
    tab,
    source,
    githubUrl,
    fnArgs,
    constructorArgs,
    traceProgress,
  ]);

  const toggleSlot = useCallback((slot: number) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (contract) {
      setSelectedSlots(
        new Set(
          contract.storageLayout
            .filter((v) => !isMapping(v.type))
            .map((v) => v.slot)
        )
      );
    }
  }, [contract]);

  const selectNone = useCallback(() => setSelectedSlots(new Set()), []);

  const selectedVars = useMemo(
    () => contract?.storageLayout.filter((v) => selectedSlots.has(v.slot)) ?? [],
    [contract, selectedSlots]
  );

  // In trace mode, use the trace's gas estimate (includes hashed mapping slots)
  // In manual mode, use the checkbox-based calculation
  const gas = useMemo(() => {
    if (traceMode && traceResult?.trace) {
      const t = traceResult.trace;
      // The analyzer backend's `current` field is the legacy, per-slot baseline.
      const current = t.gasEstimate.current;
      const mip8 = t.gasEstimate.mip8;
      const savings = current > 0 ? Math.round(((current - mip8) / current) * 100) : 0;
      const ratio = mip8 > 0 ? current / mip8 : 1;
      return { currentGas: current, mip8Gas: mip8, savings, ratio };
    }
    return calculateGas(selectedVars);
  }, [traceMode, traceResult, selectedVars]);

  const uniqueSelectedSlots = useMemo(() => {
    if (traceMode && traceResult?.trace) return traceResult.trace.uniqueSlots.length;
    return new Set(selectedVars.map((v) => v.slot)).size;
  }, [traceMode, traceResult, selectedVars]);

  const uniqueSelectedPages = useMemo(() => {
    if (traceMode && traceResult?.trace) return traceResult.trace.uniquePages.length;
    return new Set(selectedVars.map((v) => v.page)).size;
  }, [traceMode, traceResult, selectedVars]);
  const pages = useMemo(() => (contract ? groupByPage(contract.storageLayout) : new Map()), [contract]);

  // Sets for traced read/write slots (for visual distinction)
  const tracedReadSlots = useMemo(
    () => new Set(traceResult?.trace?.reads.map((r) => r.slot) ?? []),
    [traceResult]
  );
  const tracedWriteSlots = useMemo(
    () => new Set(traceResult?.trace?.writes.map((w) => w.slot) ?? []),
    [traceResult]
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
        Storage Layout Analyzer
      </h1>
      <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
        Paste Solidity source or a GitHub repo URL. The backend compiles with
        Foundry and extracts the storage layout with full import resolution.
      </p>
      <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-8">
        Select which variables a function accesses to calculate MIP-8 gas savings.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("paste")}
          className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
            tab === "paste"
              ? "bg-text-primary text-surface border-text-primary"
              : "bg-surface-elevated border-border hover:border-text-secondary"
          }`}
        >
          Paste Solidity
        </button>
        <button
          onClick={() => setTab("github")}
          className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
            tab === "github"
              ? "bg-text-primary text-surface border-text-primary"
              : "bg-surface-elevated border-border hover:border-text-secondary"
          }`}
        >
          GitHub URL
        </button>
      </div>

      {/* Input */}
      {tab === "paste" ? (
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full h-64 font-mono text-xs bg-surface-elevated border border-border rounded-xl p-4 resize-y focus:outline-none focus:border-text-secondary mb-6"
          placeholder="Paste Solidity source..."
          spellCheck={false}
        />
      ) : (
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/Uniswap/v2-core"
            className="flex-1 font-mono text-xs bg-surface-elevated border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-text-secondary"
          />
        </div>
      )}

      {/* Popular repos */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="font-mono text-xs text-text-tertiary">Try:</span>
        {POPULAR_REPOS.map((repo) => (
          <button
            key={repo.url}
            onClick={() => handleQuickRepo(repo.url)}
            disabled={loading}
            className="font-mono text-xs px-2.5 py-1 rounded-md border border-border bg-surface-elevated hover:border-text-secondary hover:bg-surface transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default"
          >
            {repo.name}
          </button>
        ))}
      </div>

      {/* Analyze button + progress */}
      <div className="mb-8">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`font-mono text-xs px-6 py-3 rounded-lg border transition-all ${
            loading
              ? "bg-surface-elevated border-border text-text-tertiary cursor-default"
              : "bg-solution-accent text-white border-solution-accent hover:bg-solution-accent/90 cursor-pointer"
          }`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <AnimatePresence>
          {analyzeProgress.active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 max-w-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs text-text-secondary">
                  {analyzeProgress.label}
                </span>
                <span className="font-mono text-xs text-text-tertiary tabular-nums">
                  {analyzeProgress.pct}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-solution-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${analyzeProgress.pct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Errors */}
      <AnimatePresence>
        {result && !result.success && result.errors && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-lg bg-problem-bg border border-problem-cell-hover mb-6"
          >
            {result.errors.map((err, i) => (
              <pre key={i} className="font-mono text-xs text-problem-accent whitespace-pre-wrap mb-1">
                {err}
              </pre>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {result?.success && result.contracts && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Contract picker (if multiple) */}
          {result.contracts.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {result.contracts.map((c, i) => (
                <button
                  key={`${c.name}-${i}`}
                  onClick={() => handleSelectContract(i)}
                  className={`font-mono text-xs px-3 py-2 rounded-md border transition-all cursor-pointer ${
                    i === selectedContract
                      ? "bg-text-primary text-surface border-text-primary"
                      : "bg-surface-elevated border-border hover:border-text-secondary"
                  }`}
                >
                  {c.name}
                  <span className="text-text-tertiary ml-1.5">
                    {c.storageLayout.length} vars
                  </span>
                </button>
              ))}
            </div>
          )}

          {contract && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <p className="font-mono text-sm text-text-primary font-semibold">
                  {contract.name}
                </p>
                <p className="font-mono text-xs text-text-tertiary">
                  {contract.storageLayout.length} storage variable
                  {contract.storageLayout.length !== 1 ? "s" : ""},{" "}
                  {pages.size} page{pages.size !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Function trace panel */}
              {functions.length > 0 && (
                <div className="bg-surface-elevated border border-border rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-solution-accent animate-pulse" />
                    <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                      Execution trace
                    </p>
                    <span className="font-mono text-xs text-text-tertiary ml-auto">
                      Deploy &rarr; call &rarr; trace SLOAD/SSTORE opcodes
                    </span>
                  </div>

                  {/* Constructor args (if needed) */}
                  {constructorAbi && constructorAbi.inputs.length > 0 && (
                    <div className="mb-3">
                      <p className="font-mono text-xs text-text-tertiary mb-1">
                        Constructor args
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {constructorAbi.inputs.map((input, i) => (
                          <input
                            key={`ctor-${i}`}
                            type="text"
                            value={constructorArgs[i] || ""}
                            onChange={(e) => {
                              const next = [...constructorArgs];
                              next[i] = e.target.value;
                              setConstructorArgs(next);
                            }}
                            placeholder={`${input.name}: ${input.type}`}
                            className="font-mono text-xs bg-surface border border-border rounded-md px-3 py-2 focus:outline-none focus:border-text-secondary flex-1 min-w-[140px]"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-2">
                    {/* Function selector */}
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={selectedFunction}
                        onChange={(e) => {
                          setSelectedFunction(e.target.value);
                          setTraceResult(null);
                          setTraceMode(false);
                          const fn = functions.find(
                            (f) => f.name === e.target.value
                          );
                          setFnArgs(fn ? fn.inputs.map(() => "") : []);
                        }}
                        className="w-full font-mono text-xs bg-surface border border-border rounded-md px-3 py-2 focus:outline-none focus:border-text-secondary cursor-pointer"
                      >
                        <option value="">Select a function...</option>
                        {functions.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}({f.inputs.map((i) => i.type).join(", ")})
                            {f.stateMutability === "view" ||
                            f.stateMutability === "pure"
                              ? " [view]"
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Function args */}
                    {selectedFnAbi?.inputs.map((input, i) => (
                      <input
                        key={`arg-${i}`}
                        type="text"
                        value={fnArgs[i] || ""}
                        onChange={(e) => {
                          const next = [...fnArgs];
                          next[i] = e.target.value;
                          setFnArgs(next);
                        }}
                        placeholder={`${input.name}: ${input.type}`}
                        className="font-mono text-xs bg-surface border border-border rounded-md px-3 py-2 focus:outline-none focus:border-text-secondary flex-1 min-w-[120px]"
                      />
                    ))}

                    {/* Trace button */}
                    <button
                      onClick={handleTrace}
                      disabled={!selectedFunction || tracing}
                      className={`font-mono text-xs px-4 py-2 rounded-md border transition-all whitespace-nowrap ${
                        !selectedFunction || tracing
                          ? "bg-surface border-border text-text-tertiary cursor-default"
                          : "bg-text-primary text-surface border-text-primary hover:bg-text-primary/90 cursor-pointer"
                      }`}
                    >
                      {tracing ? "Tracing..." : "Trace"}
                    </button>
                  </div>

                  {/* Trace progress */}
                  <AnimatePresence>
                    {traceProgress.active && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs text-text-secondary">
                            {traceProgress.label}
                          </span>
                          <span className="font-mono text-xs text-text-tertiary tabular-nums">
                            {traceProgress.pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-text-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${traceProgress.pct}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Trace errors */}
                  {traceResult && !traceResult.success && traceResult.errors && (
                    <div className="mt-3 p-3 rounded-lg bg-problem-bg border border-problem-cell-hover">
                      {traceResult.errors.map((err, i) => (
                        <pre
                          key={i}
                          className="font-mono text-xs text-problem-accent whitespace-pre-wrap"
                        >
                          {err}
                        </pre>
                      ))}
                    </div>
                  )}

                  {/* Trace results summary */}
                  {traceResult?.success && traceResult.trace && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex flex-wrap items-center gap-3"
                    >
                      <span className="font-mono text-xs text-solution-accent font-semibold">
                        Traced {traceResult.trace.reads.length} SLOAD
                        {traceResult.trace.reads.length !== 1 ? "s" : ""},{" "}
                        {traceResult.trace.writes.length} SSTORE
                        {traceResult.trace.writes.length !== 1 ? "s" : ""}
                      </span>
                      <span className="font-mono text-xs text-text-tertiary">
                        {traceResult.trace.uniqueSlots.length} unique slots
                        across {traceResult.trace.uniquePages.length} page
                        {traceResult.trace.uniquePages.length !== 1 ? "s" : ""}
                      </span>
                      {traceMode && (
                        <button
                          onClick={() => {
                            setTraceMode(false);
                            selectAll();
                          }}
                          className="font-mono text-xs text-text-tertiary hover:underline cursor-pointer ml-auto"
                        >
                          Back to manual selection
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Layout */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider">
                      Storage layout by page
                    </p>
                    <div className="flex gap-2">
                      <button onClick={selectAll} className="font-mono text-xs text-solution-accent hover:underline cursor-pointer">Select all</button>
                      <button onClick={selectNone} className="font-mono text-xs text-text-tertiary hover:underline cursor-pointer">Clear</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Array.from(pages.entries())
                      .sort(([a], [b]) => a - b)
                      .map(([pageNum, vars]: [number, StorageVar[]]) => {
                        const pageBase = pageNum * 128;
                        const selectedInPage = vars.filter((v) => selectedSlots.has(v.slot));
                        return (
                          <div
                            key={pageNum}
                            className={`rounded-xl border p-4 transition-all ${
                              selectedInPage.length > 0
                                ? "bg-solution-bg border-solution-accent-light"
                                : "bg-surface-elevated border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-mono text-xs font-semibold">
                                Page {pageNum}
                                <span className="text-text-tertiary font-normal ml-2">
                                  slots {pageBase}-{pageBase + 127}
                                </span>
                              </p>
                              {selectedInPage.length > 0 && (
                                <span className="font-mono text-xs text-solution-accent">
                                  {new Set(selectedInPage.map((v) => v.slot)).size} slots selected
                                </span>
                              )}
                            </div>

                            <div className="grid gap-[1px] mb-3" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                              {Array.from({ length: 32 }, (_, i) => {
                                const absSlot = pageBase + i;
                                const hasVar = vars.some((v) => v.slot === absSlot);
                                const isSelected = selectedSlots.has(absSlot);
                                const isRead = traceMode && tracedReadSlots.has(absSlot);
                                const isWrite = traceMode && tracedWriteSlots.has(absSlot);
                                let bg = "bg-border/30";
                                if (isWrite && isRead) bg = "bg-amber-400";
                                else if (isWrite) bg = "bg-amber-500";
                                else if (isSelected) bg = "bg-solution-accent";
                                else if (hasVar) bg = "bg-solution-accent-light";
                                return (
                                  <div
                                    key={i}
                                    className={`aspect-square rounded-[1px] ${bg}`}
                                    title={
                                      traceMode
                                        ? `slot ${absSlot}${isRead ? " SLOAD" : ""}${isWrite ? " SSTORE" : ""}`
                                        : `slot ${absSlot}`
                                    }
                                  />
                                );
                              })}
                            </div>

                            <div className="space-y-1">
                              {vars.map((v) => {
                                const mapping = isMapping(v.type);
                                const isRead = traceMode && tracedReadSlots.has(v.slot);
                                const isWrite = traceMode && tracedWriteSlots.has(v.slot);
                                return (
                                  <label
                                    key={`${v.slot}-${v.label}`}
                                    className={`flex items-center gap-3 py-1 px-2 rounded cursor-pointer transition-colors ${
                                      mapping ? "opacity-60 hover:opacity-80" : "hover:bg-surface"
                                    }`}
                                  >
                                    <input type="checkbox" checked={selectedSlots.has(v.slot)} onChange={() => toggleSlot(v.slot)} className="accent-solution-accent" />
                                    <span className="font-mono text-xs text-text-tertiary w-12 tabular-nums">slot {v.slot}</span>
                                    <span className={`font-mono text-xs ${selectedSlots.has(v.slot) && !mapping ? "text-solution-accent font-semibold" : "text-text-primary"}`}>{v.label}</span>
                                    {isRead && <span className="font-mono text-xs text-solution-accent bg-solution-bg px-1.5 py-0.5 rounded">SLOAD</span>}
                                    {isWrite && <span className="font-mono text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">SSTORE</span>}
                                    <span className="font-mono text-xs text-text-tertiary ml-auto">{v.type}</span>
                                    {mapping && !traceMode && <span className="font-mono text-xs text-problem-muted">scattered</span>}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {contract.storageLayout.length === 0 && (
                    <div className="bg-surface-elevated rounded-xl border border-border p-6 text-center">
                      <p className="font-mono text-xs text-text-tertiary">
                        No storage variables found.
                      </p>
                    </div>
                  )}
                </div>

                {/* Gas sidebar */}
                <div className="space-y-4">
                  <div className="sticky top-16">
                    <p className="font-mono text-xs text-text-tertiary uppercase tracking-wider mb-3">
                      Gas comparison
                      {traceMode && (
                        <span className="text-solution-accent ml-2 normal-case">
                          (from trace)
                        </span>
                      )}
                    </p>

                    <div className="bg-surface-elevated rounded-xl border border-border p-4 mb-4">
                      <p className="font-mono text-xs text-text-tertiary mb-1">Unique slots selected</p>
                      <p className="font-mono text-2xl font-semibold text-text-primary tabular-nums">{uniqueSelectedSlots}</p>
                      <p className="font-mono text-xs text-text-tertiary">across {uniqueSelectedPages} page{uniqueSelectedPages !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="bg-problem-bg rounded-xl border border-problem-cell-hover p-4 mb-4">
                      <p className="font-mono text-xs text-problem-muted uppercase tracking-wider mb-2">Pre-MIP-8</p>
                      <motion.p key={gas.currentGas} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="font-mono text-2xl font-semibold text-problem-accent tabular-nums">{gas.currentGas.toLocaleString()}</motion.p>
                      <p className="font-mono text-xs text-text-tertiary">{uniqueSelectedSlots} x 8,100 gas</p>
                    </div>

                    <div className="bg-solution-bg rounded-xl border border-solution-accent-light p-4 mb-4">
                      <p className="font-mono text-xs text-solution-muted uppercase tracking-wider mb-2">MIP-8 (current)</p>
                      <motion.p key={gas.mip8Gas} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="font-mono text-2xl font-semibold text-solution-accent tabular-nums">{gas.mip8Gas.toLocaleString()}</motion.p>
                      <p className="font-mono text-xs text-text-tertiary">{uniqueSelectedPages} x 8,100 + {Math.max(0, uniqueSelectedSlots - uniqueSelectedPages)} x 100</p>
                    </div>

                    {gas.savings > 0 && (
                      <motion.div key={gas.savings} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="bg-surface-elevated rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-mono text-xs text-text-tertiary">Savings</p>
                          <p className="font-mono text-lg font-semibold text-solution-accent">{gas.savings}%</p>
                        </div>
                        <div className="w-full h-3 bg-problem-cell rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(gas.mip8Gas / gas.currentGas) * 100}%` }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="h-full bg-solution-accent rounded-full" />
                        </div>
                        <div className="flex justify-between mt-1 font-mono text-xs text-text-tertiary">
                          <span>MIP-8</span>
                          <span>Pre-MIP-8</span>
                        </div>
                        {gas.ratio > 1.5 && (
                          <p className="font-mono text-xs text-solution-accent font-semibold mt-2">{gas.ratio.toFixed(1)}x cheaper</p>
                        )}
                      </motion.div>
                    )}

                    {contract.storageLayout.some((v) => isMapping(v.type)) && (
                      <div className="mt-4 p-3 bg-surface rounded-lg border border-border">
                        <p className="font-mono text-xs text-text-tertiary">
                          Mapping values are stored at hashed locations and typically land on different pages. They are excluded from &quot;Select all&quot;.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
