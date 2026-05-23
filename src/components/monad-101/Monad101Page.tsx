"use client";

import Link from "next/link";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode, RefObject } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useInView } from "@/components/useInView";
import { colors } from "@/lib/colors";

type PresenterCtx = {
  presenterMode: boolean;
  currentSlide: number;
  totalSlides: number;
  helpOpen: boolean;
  closeHelp: () => void;
};

const PresenterContext = createContext<PresenterCtx>({
  presenterMode: false,
  currentSlide: 0,
  totalSlides: 0,
  helpOpen: false,
  closeHelp: () => {},
});

function usePresenter() {
  return useContext(PresenterContext);
}

function useEnterCount(threshold = 0.4): {
  ref: RefObject<HTMLDivElement | null>;
  enterCount: number;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [enterCount, setEnterCount] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let wasVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        if (visible && !wasVisible) {
          setEnterCount((c) => c + 1);
        }
        wasVisible = visible;
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, enterCount };
}

function toggleFullscreen() {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

const REFERENCES: { id: number; title: string; url: string }[] = [
  {
    id: 1,
    title: "Monad for Developers — performance overview (10k tps, 400 ms blocks, 800 ms finality)",
    url: "https://docs.monad.xyz/introduction/monad-for-developers",
  },
  {
    id: 2,
    title: "MonadBFT — pipelined consensus and the tail-forking problem",
    url: "https://docs.monad.xyz/monad-arch/consensus/monad-bft",
  },
  {
    id: 3,
    title: "RaptorCast — erasure-coded block propagation",
    url: "https://docs.monad.xyz/monad-arch/consensus/raptorcast",
  },
  {
    id: 4,
    title: "Asynchronous Execution — pipelining consensus with execution",
    url: "https://docs.monad.xyz/monad-arch/consensus/asynchronous-execution",
  },
  {
    id: 5,
    title: "Parallel Execution — optimistic concurrent transaction processing",
    url: "https://docs.monad.xyz/monad-arch/execution/parallel-execution",
  },
  {
    id: 6,
    title: "Block States — Proposed, Voted, Finalized, Verified",
    url: "https://docs.monad.xyz/monad-arch/consensus/block-states",
  },
  {
    id: 7,
    title: "Gas Pricing — gas charged by limit, not usage",
    url: "https://docs.monad.xyz/developer-essentials/gas-pricing",
  },
  {
    id: 8,
    title: "Differences between Monad and Ethereum",
    url: "https://docs.monad.xyz/developer-essentials/differences",
  },
  {
    id: 9,
    title: "MonadDb — authenticated state storage",
    url: "https://docs.monad.xyz/monad-arch/execution/monaddb",
  },
  {
    id: 10,
    title: "Reserve Balance — 10 MON reserve rules",
    url: "https://docs.monad.xyz/developer-essentials/reserve-balance",
  },
  {
    id: 11,
    title: "JIT Compilation — native-code compilation of hot EVM contracts",
    url: "https://docs.monad.xyz/monad-arch/execution/native-compilation",
  },
  {
    id: 12,
    title: "Real-Time Data Sources — WebSocket feeds and execution events SDK",
    url: "https://docs.monad.xyz/monad-arch/realtime-data/data-sources",
  },
  {
    id: 13,
    title: "Network Information — mainnet chain ID and RPC endpoints",
    url: "https://docs.monad.xyz/developer-essentials/network-information",
  },
  {
    id: 14,
    title: "Deployment Summary — gas limits, timing, WebSockets, and execution events",
    url: "https://docs.monad.xyz/developer-essentials/summary",
  },
  {
    id: 15,
    title: "JSON-RPC overview — WebSocket subscriptions and Monad-specific fields",
    url: "https://docs.monad.xyz/reference/json-rpc/overview",
  },
  {
    id: 16,
    title: "Toolkits — Monad Foundry and Hardhat compatibility",
    url: "https://docs.monad.xyz/tooling-and-infra/toolkits",
  },
  {
    id: 17,
    title: "Changelog — MONAD_NINE Osaka fork activation",
    url: "https://docs.monad.xyz/developer-essentials/changelog/releases#v0130-monad_nine",
  },
];

function DocsQRBadge({
  src,
  href,
  label = "scan · docs",
  size = 72,
}: {
  src: string;
  href: string;
  label?: string;
  size?: number;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-col items-center gap-1.5 select-none"
      aria-label={label}
    >
      <img
        src={src}
        alt={label}
        width={size}
        height={size}
        className="block opacity-80 group-hover:opacity-100 transition-opacity"
      />
      <span className="font-mono text-[9px] text-text-tertiary group-hover:text-text-primary transition-colors uppercase tracking-wide">
        {label}
      </span>
    </a>
  );
}

function Cite({ n }: { n: number | number[] }) {
  const { presenterMode } = usePresenter();
  if (presenterMode) return null;
  const ids = Array.isArray(n) ? n : [n];
  return (
    <sup className="font-mono text-[10px] text-text-tertiary ml-0.5 whitespace-nowrap">
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && <span className="text-text-tertiary/60">,</span>}
          <a
            href={`#ref-${id}`}
            className="hover:text-solution-accent transition-colors"
          >
            [{id}]
          </a>
        </span>
      ))}
    </sup>
  );
}

type Metric = {
  label: string;
  ethereum: string;
  target: number;
  format: (v: number) => string;
  suffix: string;
  note: string;
};

const METRICS: Metric[] = [
  {
    label: "Throughput",
    ethereum: "~10 tx/s",
    target: 10000,
    format: (v) => Math.round(v).toLocaleString(),
    suffix: " tx/s",
    note: "More onchain interactions fit inside one product flow.",
  },
  {
    label: "Block frequency",
    ethereum: "12 sec",
    target: 400,
    format: (v) => Math.round(v).toString(),
    suffix: " ms",
    note: "Fast enough for subsecond feedback instead of loading screens.",
  },
  {
    label: "Finality",
    ethereum: "12-18 min",
    target: 800,
    format: (v) => Math.round(v).toString(),
    suffix: " ms",
    note: "Irreversible product decisions can settle quickly.",
  },
  {
    label: "Gas throughput",
    ethereum: "2.5M gas/s",
    target: 500,
    format: (v) => `${Math.round(v)}M`,
    suffix: " gas/s",
    note: "More contract work can happen without hiding chain latency.",
  },
];

const METRICS_CYCLE_SEC = 7;
const METRICS_FILL_SEC = 2.6;

export default function Monad101Page() {
  const [presenterMode, setPresenterMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(6);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("monad101-present") === "1";
    const url = new URLSearchParams(window.location.search);
    if (url.get("present") === "1" || saved) setPresenterMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("monad101-present", presenterMode ? "1" : "0");
    const html = document.documentElement;
    if (presenterMode) html.classList.add("presenter-mode");
    else html.classList.remove("presenter-mode");
    return () => html.classList.remove("presenter-mode");
  }, [presenterMode]);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("section.slide");
    setTotalSlides(sections.length);
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Array.from(sections).indexOf(visible.target as HTMLElement);
        if (idx !== -1) setCurrentSlide(idx);
      },
      { threshold: [0.35, 0.55, 0.75] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [presenterMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target && target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (helpOpen) {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((h) => !h);
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        setPresenterMode((p) => !p);
        return;
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (!presenterMode) return;
      const isNext =
        e.key === "ArrowDown" ||
        e.key === "ArrowRight" ||
        e.key === "PageDown" ||
        e.key === " " ||
        e.key === "Enter";
      const isPrev =
        e.key === "ArrowUp" ||
        e.key === "ArrowLeft" ||
        e.key === "PageUp";
      if (!isNext && !isPrev) return;
      e.preventDefault();
      const sections = document.querySelectorAll<HTMLElement>("section.slide");
      const next = isNext
        ? Math.min(currentSlide + 1, sections.length - 1)
        : Math.max(currentSlide - 1, 0);
      sections[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [presenterMode, currentSlide, helpOpen]);

  return (
    <PresenterContext.Provider
      value={{
        presenterMode,
        currentSlide,
        totalSlides,
        helpOpen,
        closeHelp: () => setHelpOpen(false),
      }}
    >
      <main className="bg-surface text-text-primary">
        <Hero />

      <VisualSection
        tone="alt"
        eyebrow="01 / Identity"
        title="Same EVM surface, new engine underneath"
        copy={
          <p>
            Contracts, wallets, accounts, and RPC integrations stay
            familiar<Cite n={[1, 8]} />. Underneath, Monad is its own Layer 1 with
            its own validators, state, and ordered blocks<Cite n={2} />.
          </p>
        }
      >
        <LayerMap />
      </VisualSection>

      <VisualSection
        tone="surface"
        eyebrow="02 / Mechanics"
        title="Order, run parallel, commit serial, repeat"
        copy={
          <>
            <p>
              Consensus orders the next block while execution runs the previous
              one<Cite n={[2, 4]} />. Inside each execution slot, transactions
              execute optimistically in parallel and merge back in the
              block&apos;s original order<Cite n={5} />.
            </p>
            <p className="mt-3">
              The outer pipeline and the inner parallelism compose.
              Verification of the state root lands later still, on a
              delay<Cite n={[4, 6]} />.
            </p>
          </>
        }
      >
        <EngineDiagram />
      </VisualSection>

      <WideSection
        tone="alt"
        eyebrow="03 / Block states"
        title="Use block states as product confidence levels"
        copy={
          <p>
            Monad gives applications earlier signals for feedback and stronger
            signals for settlement, accounting, and delayed state-root
            assurance<Cite n={[4, 6, 14, 15]} />.
          </p>
        }
      >
        <BlockStatesDiagram />
      </WideSection>

      <VisualSection
        tone="surface"
        eyebrow="04 / Numbers"
        title="Read the numbers as UX constraints"
        copy={
          <p>
            The headline metrics matter because they change what product teams
            can show immediately, settle quickly, and keep onchain<Cite n={[1, 4, 14]} />.
          </p>
        }
      >
        <MetricsDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        eyebrow="05 / Edge"
        title="Tail-fork resistance. Proposed-state reads."
        copy={
          <>
            <p>
              MonadBFT prevents the tail-fork vector where a leader forks away
              its predecessor&apos;s block. That removes that specific
              predecessor-block reorder or replacement path<Cite n={2} />.
            </p>
            <p className="mt-3">
              Meanwhile, RPC reads (<span className="font-mono">eth_call</span>,
              <span className="font-mono"> eth_estimateGas</span>) can run
              against the latest proposed state — not only the finalized
              state<Cite n={[4, 6, 15]} />.
            </p>
          </>
        }
      >
        <EdgeDiagram />
      </VisualSection>

      <VisualSection
        tone="surface"
        eyebrow="06 / Data out"
        title="Fast data comes from WebSockets and execution events"
        copy={
          <p>
            High-throughput consumers can avoid polling: Monad offers
            Geth-compatible WebSocket feeds, Monad-specific{" "}
            <span className="font-mono">monadNewHeads</span> /{" "}
            <span className="font-mono">monadLogs</span>, and a local
            execution-events SDK that reads shared memory as execution publishes
            events<Cite n={[12, 15]} />.
          </p>
        }
      >
        <RealtimeDataDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        eyebrow="07 / Build today"
        title="Mainnet constants. Same EVM workflow."
        copy={
          <p>
            Chain ID 143, currency MON, and public RPC endpoints are listed in
            Network Information. Standard EVM tools and wallets keep the same
            shape; update the chain ID and RPC endpoint<Cite n={[1, 13, 16]} />.
          </p>
        }
      >
        <BuildTodayDiagram />
      </VisualSection>

      <ClosingSection />

      <QASlide />

      <ReferencesList />
      </main>
      <PresenterChrome />
    </PresenterContext.Provider>
  );
}

function PresenterChrome() {
  const { presenterMode, currentSlide, totalSlides, helpOpen, closeHelp } =
    usePresenter();
  return (
    <>
      <HelpOverlay open={helpOpen} onClose={closeHelp} />
      {presenterMode && (
        <div className="fixed top-6 right-6 z-50 font-mono text-sm px-3 py-1.5 rounded-full bg-surface-elevated/90 border border-border backdrop-blur-sm tabular-nums pointer-events-none">
          <span className="text-text-primary">{currentSlide + 1}</span>
          <span className="text-text-tertiary"> / {totalSlides}</span>
        </div>
      )}
      {presenterMode && totalSlides > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 pointer-events-none">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 bg-solution-accent"
                  : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
      <div className="fixed bottom-4 right-6 z-50 font-mono text-[10px] text-text-tertiary px-2.5 py-1 rounded-full bg-surface-elevated/70 border border-border backdrop-blur-sm pointer-events-none uppercase tracking-wide">
        {presenterMode ? (
          <>
            <kbd className="text-text-primary">P</kbd> exit ·{" "}
            <kbd className="text-text-primary">F</kbd> fullscreen ·{" "}
            <kbd className="text-text-primary">?</kbd> help
          </>
        ) : (
          <>
            Press <kbd className="text-text-primary">P</kbd> for presenter mode
          </>
        )}
      </div>
    </>
  );
}

function HelpOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const rows: [string, string][] = [
    ["P", "toggle presenter mode"],
    ["F", "toggle fullscreen"],
    ["→ · Space · PageDown", "next slide"],
    ["← · PageUp", "previous slide"],
    ["?", "show this help"],
    ["Esc", "close help"],
  ];
  return (
    <div
      className="fixed inset-0 z-[60] bg-text-primary/70 backdrop-blur-sm flex items-center justify-center px-6"
      onClick={onClose}
    >
      <div
        className="bg-surface-elevated border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-[11px] text-text-tertiary tracking-wide mb-5 uppercase">
          Keyboard shortcuts
        </p>
        <ul className="space-y-3">
          {rows.map(([keys, label]) => (
            <li
              key={keys}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4"
            >
              <span className="text-sm text-text-secondary">{label}</span>
              <span className="font-mono text-xs text-text-primary text-right">
                {keys}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full font-mono text-[10px] text-text-tertiary hover:text-text-primary transition-colors uppercase tracking-wide"
        >
          press esc or click outside to close
        </button>
      </div>
    </div>
  );
}

function EdgeDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.3);
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: EDGE_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          ref={ref}
          className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6"
          onMouseLeave={() => setActiveId(null)}
        >
          <HoverExplain id="tail-fork">
            <TailForkPanel
              enterCount={enterCount}
              shouldReduceMotion={shouldReduceMotion}
            />
          </HoverExplain>
          <div className="my-5 h-px bg-border" />
          <HoverExplain id="speculative-exec">
            <SpeculativeExecPanel
              enterCount={enterCount}
              shouldReduceMotion={shouldReduceMotion}
            />
          </HoverExplain>
          <div className="mt-5 flex justify-end">
            <DocsQRBadge
              src="/qr-monad-bft.svg"
              href="https://docs.monad.xyz/monad-arch/consensus/monad-bft"
            />
          </div>
        </div>
        <DiagramExplainer defaultText="Hover either panel for the porting impact." />
      </div>
    </DiagramHoverContext.Provider>
  );
}

function TailForkPanel({
  enterCount,
  shouldReduceMotion,
}: {
  enterCount: number;
  shouldReduceMotion: boolean;
}) {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <div>
      <p className="font-mono text-[10px] text-text-tertiary mb-3 tracking-wide uppercase">
        Tail-fork resistance
      </p>
      <div className="relative pl-2">
        <div className="flex items-center gap-2">
          {["N−2", "N−1", "N", "N+1"].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <motion.div
                key={`block-${i}-${enterCount}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.5, delay: i * 0.18, ease }
                }
                className="h-9 px-3 rounded-lg border-2 flex items-center"
                style={{
                  backgroundColor: colors.userBg,
                  borderColor: colors.userAccent,
                }}
              >
                <span
                  className="font-mono text-xs"
                  style={{ color: colors.userAccent }}
                >
                  {label}
                </span>
              </motion.div>
              {i < 3 && (
                <span className="text-text-tertiary font-mono text-xs">→</span>
              )}
            </div>
          ))}
        </div>

        {!shouldReduceMotion && (
          <motion.div
            key={`fork-${enterCount}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: [0, 1, 1, 0.3, 0.3], y: [-4, 0, 0, 0, 0] }}
            transition={{
              duration: 5,
              times: [0, 0.25, 0.5, 0.65, 1],
              ease: "easeOut",
            }}
            className="mt-3 flex items-center gap-2 pl-[40%]"
          >
            <span className="text-text-tertiary font-mono text-xs">↳</span>
            <div
              className="h-9 px-3 rounded-lg border-2 border-dashed flex items-center relative"
              style={{
                borderColor: colors.problemAccentStrong,
                backgroundColor: colors.problemBg,
              }}
            >
              <span
                className="font-mono text-xs"
                style={{ color: colors.problemAccentStrong }}
              >
                fork attempt
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 0, 1, 1, 1] }}
                transition={{
                  duration: 5,
                  times: [0, 0.45, 0.55, 1, 1],
                  ease: "easeOut",
                }}
                className="absolute left-0 right-0 top-1/2 h-[2px] origin-left"
                style={{ backgroundColor: colors.problemAccentStrong }}
              />
            </div>
            <span
              className="font-mono text-[10px]"
              style={{ color: colors.problemAccentStrong }}
            >
              ✗ rejected by MonadBFT
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SpeculativeExecPanel({
  enterCount,
  shouldReduceMotion,
}: {
  enterCount: number;
  shouldReduceMotion: boolean;
}) {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <div>
      <p className="font-mono text-[10px] text-text-tertiary mb-3 tracking-wide uppercase">
        Speculative execution
      </p>
      <div className="grid grid-cols-[80px_minmax(0,1fr)_110px] items-center gap-3">
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
          <p className="font-mono text-[10px] text-text-tertiary">your app</p>
          <p className="font-mono text-xs text-text-primary">wallet</p>
        </div>

        <div className="relative h-9 rounded-full bg-border/50 overflow-hidden">
          {!shouldReduceMotion && (
            <>
              <motion.div
                key={`call-${enterCount}`}
                initial={{ left: "-10%", width: "20%" }}
                animate={{ left: ["-10%", "85%"] }}
                transition={{
                  duration: 1.6,
                  delay: 0.3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
                className="absolute inset-y-1 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.userAccent }}
              >
                <span
                  className="font-mono text-[10px]"
                  style={{ color: colors.surface }}
                >
                  eth_call
                </span>
              </motion.div>
              <motion.div
                key={`return-${enterCount}`}
                initial={{ right: "-10%", width: "20%" }}
                animate={{ right: ["-10%", "85%"] }}
                transition={{
                  duration: 1.4,
                  delay: 2.2,
                  repeat: Infinity,
                  repeatDelay: 2.2,
                  ease: "easeInOut",
                }}
                className="absolute inset-y-1 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.solutionAccent }}
              >
                <span
                  className="font-mono text-[10px]"
                  style={{ color: colors.surface }}
                >
                  fresh
                </span>
              </motion.div>
            </>
          )}
        </div>

        <div
          className="rounded-lg border-2 px-3 py-2 text-center"
          style={{
            borderColor: colors.solutionAccent,
            backgroundColor: colors.solutionBg,
          }}
        >
          <p
            className="font-mono text-[10px]"
            style={{ color: colors.solutionAccent }}
          >
            proposed
          </p>
          <p
            className="font-mono text-xs"
            style={{ color: colors.solutionAccent }}
          >
            block N
          </p>
        </div>
      </div>
      <p className="font-mono text-[10px] text-text-tertiary mt-3 text-center">
        latest tag · ahead of finalized
      </p>
    </div>
  );
}

function RealtimeDataDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.3);
  const [activeId, setActiveId] = useState<string | null>(null);
  const frozen = shouldReduceMotion || activeId !== null;

  const consumers: { id: string; label: string }[] = [
    { id: "indexer", label: "indexer" },
    { id: "explorer-ui", label: "explorer UI" },
    { id: "trading-app", label: "trading app" },
    { id: "wallet-ui", label: "wallet UI" },
  ];

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: REALTIME_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          ref={ref}
          className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6"
          onMouseLeave={() => setActiveId(null)}
        >
          <div className="grid grid-cols-[110px_minmax(0,1fr)_120px] items-center gap-4">
            <HoverExplain id="executing-block">
              <div
                className="rounded-xl border-2 p-3 text-center"
                style={{
                  borderColor: colors.solutionAccent,
                  backgroundColor: colors.solutionBg,
                }}
              >
                <p
                  className="font-mono text-[10px] mb-1"
                  style={{ color: colors.solutionAccent }}
                >
                  executing
                </p>
                <p
                  className="font-mono text-sm"
                  style={{ color: colors.solutionAccent }}
                >
                  block N
                </p>
              </div>
            </HoverExplain>

            <div className="relative h-32 overflow-hidden">
              {!frozen &&
                Array.from({ length: 16 }).map((_, i) => {
                  const lane = i % consumers.length;
                  const burst = Math.floor(i / consumers.length);
                  const yPct = 12 + lane * 22;
                  return (
                    <motion.div
                      key={`evt-${i}-${enterCount}`}
                      initial={{ left: "-5%", opacity: 0 }}
                      animate={{
                        left: ["-5%", "100%"],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 2.2,
                        delay: burst * 0.58,
                        times: [0, 0.1, 0.85, 1],
                        repeat: Infinity,
                        repeatDelay: 0,
                        ease: "linear",
                      }}
                      className="absolute h-1.5 w-3 rounded-full"
                      style={{
                        top: `${yPct}%`,
                        backgroundColor: colors.solutionAccent,
                      }}
                    />
                  );
                })}
            </div>

            <div className="space-y-1.5">
              {consumers.map((c) => (
                <HoverExplain key={c.id} id={c.id}>
                  <motion.div
                    className="rounded-md border border-border bg-surface px-2.5 py-1.5"
                    animate={
                      frozen
                        ? undefined
                        : { borderColor: [colors.border, colors.solutionAccent, colors.border] }
                    }
                    transition={
                      frozen
                        ? undefined
                        : {
                            duration: 0.6,
                            delay: 1,
                            repeat: Infinity,
                            repeatDelay: 2.5,
                            ease: "easeInOut",
                          }
                    }
                  >
                    <p className="font-mono text-[10px] text-text-primary text-center">
                      {c.label}
                    </p>
                  </motion.div>
                </HoverExplain>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <HoverExplain id="ipc-card">
              <div className="rounded-lg bg-surface border border-border p-3">
                <p className="font-mono text-[10px] text-text-tertiary mb-1">
                  shared-memory IPC
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-mono">libmonad_event</span> /{" "}
                  <span className="font-mono">monad-exec-events</span> for high-throughput consumers
                </p>
              </div>
            </HoverExplain>
            <HoverExplain id="ws-card">
              <div className="rounded-lg bg-surface border border-border p-3">
                <p className="font-mono text-[10px] text-text-tertiary mb-1">
                  WebSocket extension
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <span className="font-mono">monadNewHeads</span> /{" "}
                  <span className="font-mono">monadLogs</span> include blockId + commitState
                </p>
              </div>
            </HoverExplain>
          </div>

          <div className="mt-4 flex justify-end">
            <DocsQRBadge
              src="/qr-realtime.svg"
              href="https://docs.monad.xyz/monad-arch/realtime-data"
            />
          </div>
        </div>
        <DiagramExplainer defaultText="Hover any consumer or transport for how it plugs in." />
      </div>
    </DiagramHoverContext.Provider>
  );
}

function BuildTodayDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.3);
  const [activeId, setActiveId] = useState<string | null>(null);

  const facts: { label: string; value: string }[] = [
    { label: "Chain ID", value: "143" },
    { label: "Currency", value: "MON" },
    { label: "RPC", value: "https://rpc.monad.xyz" },
    { label: "WS", value: "wss://rpc.monad.xyz" },
    { label: "Explorer", value: "monadvision.com" },
    { label: "Tools", value: "Monad Foundry · Hardhat" },
  ];

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: BUILD_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          ref={ref}
          className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6"
          onMouseLeave={() => setActiveId(null)}
        >
          <HoverExplain id="deploy-cmd">
            <div className="rounded-xl bg-surface border border-border p-4 font-mono text-xs leading-relaxed">
              <span className="text-text-tertiary">$ </span>
              <motion.span
                key={`cmd-${enterCount}`}
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.6, delay: 0.3 }
                }
                className="text-text-primary"
              >
                forge create --rpc-url{" "}
                <span style={{ color: colors.solutionAccent }}>
                  https://rpc.monad.xyz
                </span>{" "}
                src/Counter.sol:Counter
              </motion.span>
              <motion.span
                key={`reply-${enterCount}`}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.6, delay: 1.4, ease: [0.16, 1, 0.3, 1] }
                }
                className="block mt-2"
                style={{ color: colors.solutionAccent }}
              >
                ✓ Deployer · 0x… · txHash · block 8421317
              </motion.span>
            </div>
          </HoverExplain>

          <HoverExplain id="chain-info" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {facts.map((fact, i) => (
                <motion.div
                  key={`${fact.label}-${enterCount}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.5, delay: 0.6 + i * 0.08, ease: [0.16, 1, 0.3, 1] }
                  }
                  className="rounded-lg bg-surface border border-border px-3 py-2"
                >
                  <p className="font-mono text-[10px] text-text-tertiary">
                    {fact.label}
                  </p>
                  <p
                    className="font-mono text-xs"
                    style={{ color: colors.solutionAccent }}
                  >
                    {fact.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </HoverExplain>

          <HoverExplain id="status" className="mt-4">
            <div className="rounded-lg bg-solution-bg border border-solution-accent-light px-3 py-2 text-center">
              <p
                className="font-mono text-xs"
                style={{ color: colors.solutionAccent }}
              >
                mainnet · chain 143 · MON
              </p>
            </div>
          </HoverExplain>

          <div className="mt-4 flex justify-end">
            <DocsQRBadge
              src="/qr-network.svg"
              href="https://docs.monad.xyz/developer-essentials/network-information"
              label="scan · network info"
            />
          </div>
        </div>
        <DiagramExplainer defaultText="Hover any block for what it means for porting." />
      </div>
    </DiagramHoverContext.Provider>
  );
}

function QASlide() {
  const { presenterMode } = usePresenter();
  if (!presenterMode) return null;
  return (
    <section className="slide min-h-screen flex flex-col items-center justify-center px-6 bg-surface text-center">
      <motion.h2
        className="text-6xl sm:text-7xl md:text-8xl font-light mb-12 leading-tight tracking-tight"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        Questions?
      </motion.h2>
      <motion.a
        href="https://docs.monad.xyz"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="group flex flex-col items-center gap-4"
      >
        <img
          src="/qr-docs.svg"
          alt="QR code to docs.monad.xyz"
          width={320}
          height={320}
          className="block"
        />
        <span className="font-mono text-lg text-text-tertiary group-hover:text-solution-accent transition-colors">
          docs.monad.xyz
        </span>
      </motion.a>
    </section>
  );
}

function ReferencesList() {
  const { presenterMode } = usePresenter();
  if (presenterMode) return null;
  return (
    <section
      id="references"
      className="bg-surface border-t border-border px-6 py-14 scroll-mt-24"
    >
      <div className="max-w-7xl mx-auto">
        <p className="font-mono text-[11px] text-text-tertiary tracking-wide mb-5 uppercase">
          References
        </p>
        <ol className="space-y-2.5 text-sm text-text-secondary font-light">
          {REFERENCES.map((ref) => (
            <li
              key={ref.id}
              id={`ref-${ref.id}`}
              className="grid grid-cols-[28px_minmax(0,1fr)] gap-2 leading-relaxed scroll-mt-24"
            >
              <span className="font-mono text-text-tertiary tabular-nums">
                {ref.id}.
              </span>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary hover:text-solution-accent transition-colors underline-offset-2 hover:underline"
              >
                {ref.title}
                <span className="font-mono text-[10px] text-text-tertiary ml-2">
                  docs.monad.xyz
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Hero() {
  const { presenterMode } = usePresenter();
  return (
    <section className="slide min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-4xl relative z-10 mt-30"
      >
        <h1
          className={`${
            presenterMode
              ? "text-5xl sm:text-6xl md:text-7xl"
              : "text-4xl sm:text-5xl md:text-6xl"
          } font-light leading-[1.1] tracking-tight mb-6`}
        >
          A shared computer,{" "}
          <span className="font-semibold italic">rebuilt around throughput.</span>
        </h1>
        {!presenterMode && (
          <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            EVM compatible surface. Pipelined consensus, parallel execution,
            fast state.
          </p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-12 mb-16 relative z-10 w-full max-w-4xl"
      >
        <PipelineHeroVisual />
      </motion.div>
    </section>
  );
}

function SectionEyebrow({
  children,
  large,
}: {
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <p
      className={`font-mono ${
        large ? "text-sm mb-4" : "text-[11px] mb-3"
      } text-text-tertiary tracking-wide uppercase`}
    >
      {children}
    </p>
  );
}

function VisualSection({
  title,
  copy,
  children,
  tone = "alt",
  eyebrow,
}: {
  title: string;
  copy: ReactNode;
  children: ReactNode;
  tone?: "alt" | "surface";
  eyebrow?: string;
}) {
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.12);

  return (
    <section
      className={`slide min-h-screen px-6 py-20 flex items-center ${tone === "alt" ? "bg-surface-alt" : "bg-surface"}`}
    >
      <div
        ref={ref}
        className={`w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] gap-9 lg:gap-14 items-center section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <div>
          {eyebrow && (
            <SectionEyebrow large={presenterMode}>{eyebrow}</SectionEyebrow>
          )}
          <h2
            className={`${
              presenterMode
                ? "text-4xl sm:text-5xl md:text-6xl mb-6"
                : "text-2xl sm:text-3xl mb-4 text-balance"
            } font-semibold leading-tight`}
          >
            {title}
          </h2>
          {!presenterMode && (
            <div className="text-base text-text-secondary font-light leading-relaxed">
              {copy}
            </div>
          )}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function WideSection({
  title,
  copy,
  children,
  tone = "alt",
  eyebrow,
}: {
  title: string;
  copy: ReactNode;
  children: ReactNode;
  tone?: "alt" | "surface";
  eyebrow?: string;
}) {
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.12);

  return (
    <section
      className={`slide min-h-screen px-6 py-20 flex items-center ${tone === "alt" ? "bg-surface-alt" : "bg-surface"}`}
    >
      <div
        ref={ref}
        className={`w-full max-w-7xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="max-w-3xl mb-10">
          {eyebrow && (
            <SectionEyebrow large={presenterMode}>{eyebrow}</SectionEyebrow>
          )}
          <h2
            className={`${
              presenterMode
                ? "text-4xl sm:text-5xl md:text-6xl mb-6"
                : "text-3xl sm:text-4xl mb-4"
            } font-semibold leading-tight`}
          >
            {title}
          </h2>
          {!presenterMode && (
            <div className="text-base text-text-secondary font-light leading-relaxed">
              {copy}
            </div>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}

const BLOCK_STATES_CYCLE_SEC = 8;
const BLOCK_STATES_PULSE_SEC = 0.7;

function BlockStatesDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.4);
  const [activeId, setActiveId] = useState<string | null>(null);
  const frozen = shouldReduceMotion || activeId !== null;
  const states: {
    id: string;
    label: string;
    rpcTag: string | null;
    timing: string;
    body: string;
    example: string;
    color: string;
  }[] = [
    {
      id: "proposed",
      label: "Proposed",
      rpcTag: "latest / pending",
      timing: "T",
      body: "Fast UI feedback",
      example: "Echo that the tap landed before the user retries.",
      color: colors.userAccent,
    },
    {
      id: "voted",
      label: "Voted",
      rpcTag: "safe",
      timing: "T+1 · ~400 ms",
      body: "Stronger confidence",
      example: "Reveal the next step in a multi-step flow.",
      color: colors.problemAccentStrong,
    },
    {
      id: "finalized",
      label: "Finalized",
      rpcTag: "finalized",
      timing: "T+2 · ~800 ms",
      body: "Settlement decisions",
      example: "Record an irreversible payment or transfer.",
      color: colors.solutionAccent,
    },
    {
      id: "verified",
      label: "Verified",
      rpcTag: null,
      timing: "T+5 · ~2 s",
      body: "Delayed Merkle root finalized",
      example: "Latest verified block = latest finalized block - execution delay.",
      color: colors.textPrimary,
    },
  ];

  const repeatDelay = BLOCK_STATES_CYCLE_SEC - BLOCK_STATES_PULSE_SEC;

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: BLOCK_STATES_HINTS }}
    >
      <div ref={ref} className="relative" onMouseLeave={() => setActiveId(null)}>
        <div className="hidden sm:block absolute left-[12.5%] right-[12.5%] top-[28px] h-px bg-border" />
        {!frozen && (
          <motion.div
            key={`line-${enterCount}`}
            className="hidden sm:block absolute left-[12.5%] right-[12.5%] top-[28px] h-px origin-left"
            style={{ backgroundColor: colors.solutionAccent }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 1, 0] }}
            transition={{
              duration: BLOCK_STATES_CYCLE_SEC,
              times: [0, 0.6, 0.85, 1],
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {states.map((state, index) => (
            <HoverExplain key={state.id} id={state.id} className="flex flex-col">
              <div className="flex justify-center mb-4">
                <motion.div
                  key={`marker-${index}-${enterCount}`}
                  className="relative z-10 h-14 w-14 rounded-full border-4 border-surface-alt flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: state.color }}
                  animate={frozen ? undefined : { scale: [1, 1.18, 1] }}
                  transition={
                    frozen
                      ? undefined
                      : {
                          duration: BLOCK_STATES_PULSE_SEC,
                          delay: index * 1.6,
                          repeat: Infinity,
                          repeatDelay,
                          ease: "easeInOut",
                        }
                  }
                >
                  <span className="font-mono text-sm font-semibold text-surface">
                    {index + 1}
                  </span>
                </motion.div>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated p-5 flex-1">
                <div className="flex items-center justify-between mb-3 gap-2">
                  {state.rpcTag ? (
                    <span
                      className="font-mono text-[10px] px-2 py-0.5 rounded border"
                      style={{
                        color: colors.solutionAccent,
                        backgroundColor: colors.solutionBg,
                        borderColor: colors.solutionAccentLight,
                      }}
                    >
                      {state.rpcTag}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-text-tertiary">
                      no RPC tag
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-text-tertiary tabular-nums">
                    {state.timing}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{state.label}</h3>
                <p className="text-sm text-text-primary font-medium mb-3">
                  {state.body}
                </p>
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  {state.example}
                </p>
              </div>
            </HoverExplain>
          ))}
        </div>
        <div className="mt-5">
          <DiagramExplainer
            defaultText="Hover any state for when to use it."
            variant="compact"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <DocsQRBadge
            src="/qr-block-states.svg"
            href="https://docs.monad.xyz/monad-arch/consensus/block-states"
          />
        </div>
      </div>
    </DiagramHoverContext.Provider>
  );
}

const HERO_EASE = [0.16, 1, 0.3, 1] as const;
const SLIDE_W = 640;
const SLIDE_H = 360;
const SLIDE_DURATION_MS = 8000;

type SlideProps = { shouldReduceMotion: boolean };

const SLIDES: {
  key: string;
  title: string;
  note: string;
  Component: (props: SlideProps) => React.ReactNode;
}[] = [
  {
    key: "raptorcast",
    title: "RaptorCast",
    note: "erasure-coded chunks through two-hop broadcast trees",
    Component: RaptorCastSlide,
  },
  {
    key: "parallel",
    title: "Parallel execution",
    note: "transactions run in parallel, commits stay serial",
    Component: ParallelSlide,
  },
  {
    key: "pipeline",
    title: "Async execution pipeline",
    note: "consensus orders the next block while execution runs the previous",
    Component: PipelineSlide,
  },
];

function PipelineHeroVisual() {
  const shouldReduceMotion = !!useReducedMotion();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  const current = SLIDES[slide];
  const Current = current.Component;

  return (
    <div className="bg-surface-elevated rounded-xl p-5 sm:p-6 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-4 min-h-[18px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`label-${current.key}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 min-w-0"
          >
            <p className="font-mono text-[11px] text-text-primary shrink-0">
              {current.title}
            </p>
            <span className="font-mono text-[11px] text-text-tertiary truncate">
              {current.note}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative w-full" style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}` }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Current shouldReduceMotion={shouldReduceMotion} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === slide ? "w-6 bg-solution-accent" : "w-1.5 bg-border"
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

function RaptorCastSlide({ shouldReduceMotion }: SlideProps) {
  const originator = { x: 96, y: 180 };
  const firstHopNodes = [
    { id: "v2", x: 300, y: 88, range: "c0-c2" },
    { id: "v5", x: 300, y: 180, range: "c3-c5" },
    { id: "v7", x: 300, y: 272, range: "c6-c8" },
  ];
  const secondHopGroups = [
    {
      parent: firstHopNodes[0],
      recipients: [
        { id: "v1", x: 512, y: 70 },
        { id: "v3", x: 540, y: 132 },
      ],
    },
    {
      parent: firstHopNodes[1],
      recipients: [
        { id: "v4", x: 530, y: 162 },
        { id: "v6", x: 530, y: 214 },
      ],
    },
    {
      parent: firstHopNodes[2],
      recipients: [
        { id: "v8", x: 540, y: 262 },
        { id: "v9", x: 512, y: 326 },
      ],
    },
  ];
  const makeEdge = (
    key: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    delay: number,
    tone: string
  ) => ({
    key,
    from,
    to,
    dx: to.x - from.x,
    dy: to.y - from.y,
    delay,
    tone,
  });
  const secondHopNodes = secondHopGroups.flatMap((group) => group.recipients);
  const edges = secondHopGroups.flatMap((group) => [
    makeEdge(
      `leader-${group.parent.id}`,
      originator,
      group.parent,
      group.parent.y / SLIDE_H,
      colors.userAccent
    ),
    ...group.recipients.map((recipient, i) =>
      makeEdge(
        `${group.parent.id}-${recipient.id}`,
        group.parent,
        recipient,
        0.55 + i * 0.18 + group.parent.y / SLIDE_H,
        colors.solutionAccent
      )
    ),
  ]);

  const blockW = 84;
  const blockH = 50;
  const chunkPeriod = 1.7;
  const chunkSize = 5;

  return (
    <svg
      role="img"
      aria-label="A leader sends erasure-coded chunk ranges to first-hop validators, and those first-hop validators forward chunks to second-hop recipients."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <text
        x={originator.x}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        originator
      </text>
      <text
        x={300}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        first-hop
      </text>
      <text
        x={526}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        second-hop
      </text>

      {edges.map((edge) => (
        <line
          key={`line-${edge.key}`}
          x1={edge.from.x}
          y1={edge.from.y}
          x2={edge.to.x}
          y2={edge.to.y}
          stroke={colors.borderSoft}
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity={0.9}
        />
      ))}

      {secondHopNodes.map((recipient) => (
        <g key={recipient.id}>
          <circle
            cx={recipient.x}
            cy={recipient.y}
            r={15}
            fill={colors.solutionBg}
            stroke={colors.solutionAccent}
            strokeWidth="1.3"
          />
          <text
            x={recipient.x}
            y={recipient.y + 4}
            fontSize="10"
            fontFamily="monospace"
            fill={colors.solutionAccent}
            textAnchor="middle"
          >
            {recipient.id}
          </text>
        </g>
      ))}

      {!shouldReduceMotion &&
        edges.map((edge) => (
          <motion.rect
            key={edge.key}
            x={edge.from.x - chunkSize / 2}
            y={edge.from.y - chunkSize / 2}
            width={chunkSize}
            height={chunkSize}
            rx={1.2}
            fill={edge.tone}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: [0, edge.dx * 0.02, edge.dx * 0.98, edge.dx],
              y: [0, edge.dy * 0.02, edge.dy * 0.98, edge.dy],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: chunkPeriod,
              delay: edge.delay % chunkPeriod,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.06, 0.9, 1],
            }}
          />
        ))}

      {firstHopNodes.map((node) => (
        <g key={node.id}>
          <circle
            cx={node.x}
            cy={node.y}
            r={19}
            fill={colors.userBg}
            stroke={colors.userAccent}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y + 4}
            fontSize="11"
            fontFamily="monospace"
            fill={colors.userAccent}
            textAnchor="middle"
          >
            {node.id}
          </text>
          <text
            x={node.x}
            y={node.y + 33}
            fontSize="9"
            fontFamily="monospace"
            fill={colors.textTertiary}
            textAnchor="middle"
          >
            {node.range}
          </text>
        </g>
      ))}

      <motion.g
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: HERO_EASE }}
      >
        <rect
          x={originator.x - blockW / 2}
          y={originator.y - blockH / 2}
          width={blockW}
          height={blockH}
          rx={8}
          fill={colors.userAccent}
        />
        <text
          x={originator.x}
          y={originator.y + 5}
          fontSize="14"
          fontFamily="monospace"
          fill={colors.surface}
          textAnchor="middle"
        >
          block
        </text>
      </motion.g>
    </svg>
  );
}

function ParallelSlide({ shouldReduceMotion }: SlideProps) {
  const lanes = [
    { id: "A", retry: false },
    { id: "B", retry: true },
    { id: "C", retry: false },
    { id: "D", retry: false },
  ];

  const laneStartX = 86;
  const laneEndX = 460;
  const laneWidth = laneEndX - laneStartX;
  const laneHeight = 26;
  const laneGap = 30;
  const totalLanesH = lanes.length * (laneHeight + laneGap) - laneGap;
  const lanesStartY = (SLIDE_H - totalLanesH) / 2;
  const commitX = 520;
  const commitW = 56;

  const cycleSec = 2.8;

  return (
    <svg
      role="img"
      aria-label="Four transaction lanes running in parallel, with one lane re-running due to a conflict, then committing in serial order on the right."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <text
        x={(laneStartX + laneEndX) / 2}
        y={lanesStartY - 20}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        parallel
      </text>
      <text
        x={commitX + commitW / 2}
        y={lanesStartY - 20}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        serial commit
      </text>

      {lanes.map((lane, i) => {
        const y = lanesStartY + i * (laneHeight + laneGap);
        const cy = y + laneHeight / 2;
        const commitTime = 0.62 + i * 0.06;
        return (
          <g key={lane.id}>
            <text
              x={laneStartX - 12}
              y={cy + 4}
              fontSize="12"
              fontFamily="monospace"
              fill={colors.textPrimary}
              textAnchor="end"
            >
              tx {lane.id}
            </text>

            <rect
              x={laneStartX}
              y={y}
              width={laneWidth}
              height={laneHeight}
              rx={laneHeight / 2}
              fill={colors.borderSoft}
              opacity={0.55}
            />

            {lane.retry ? (
              <>
                <motion.rect
                  x={laneStartX}
                  y={y}
                  height={laneHeight}
                  rx={laneHeight / 2}
                  fill={colors.problemAccentLight}
                  initial={{ width: 0 }}
                  animate={
                    shouldReduceMotion
                      ? { width: 0 }
                      : { width: [0, laneWidth * 0.45, laneWidth * 0.45, 0, 0] }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: cycleSec,
                          times: [0, 0.22, 0.30, 0.34, 1],
                          delay: i * 0.07,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
                <motion.rect
                  x={laneStartX}
                  y={y}
                  height={laneHeight}
                  rx={laneHeight / 2}
                  fill={colors.solutionAccent}
                  initial={{ width: 0 }}
                  animate={
                    shouldReduceMotion
                      ? { width: laneWidth }
                      : { width: [0, 0, laneWidth, laneWidth, 0] }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: cycleSec,
                          times: [0, 0.38, 0.62, 0.88, 1],
                          delay: i * 0.07,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
              </>
            ) : (
              <motion.rect
                x={laneStartX}
                y={y}
                height={laneHeight}
                rx={laneHeight / 2}
                fill={colors.solutionAccent}
                initial={{ width: 0 }}
                animate={
                  shouldReduceMotion
                    ? { width: laneWidth }
                    : { width: [0, laneWidth, laneWidth, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: cycleSec,
                        times: [0, 0.55, 0.88, 1],
                        delay: i * 0.07,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            )}

            {lane.retry && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: [0, 0, 1, 1, 0, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: cycleSec,
                        times: [0, 0.20, 0.24, 0.34, 0.38, 1],
                        delay: i * 0.07,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              >
                <rect
                  x={laneStartX + laneWidth * 0.36}
                  y={y - 11}
                  width={96}
                  height={laneHeight + 18}
                  rx={5}
                  fill={colors.problemBg}
                  stroke={colors.problemAccentStrong}
                  strokeWidth="1"
                />
                <text
                  x={laneStartX + laneWidth * 0.36 + 48}
                  y={cy - 2}
                  fontSize="9"
                  fontFamily="monospace"
                  fill={colors.problemAccentStrong}
                  textAnchor="middle"
                >
                  state conflict
                </text>
                <text
                  x={laneStartX + laneWidth * 0.36 + 48}
                  y={cy + 10}
                  fontSize="9"
                  fontFamily="monospace"
                  fill={colors.problemAccentStrong}
                  textAnchor="middle"
                >
                  re-run
                </text>
              </motion.g>
            )}

            <line
              x1={laneEndX + 6}
              x2={commitX - 6}
              y1={cy}
              y2={cy}
              stroke={colors.borderSoft}
              strokeWidth="1"
              strokeDasharray="2 4"
            />

            <motion.g
              initial={{ opacity: 0, scale: 0.85 }}
              animate={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.85, 0.85, 1, 1, 0.85],
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: cycleSec,
                      times: [0, 0.55, commitTime, 0.92, 1],
                      repeat: Infinity,
                      ease: "easeOut",
                    }
              }
            >
              <rect
                x={commitX}
                y={y}
                width={commitW}
                height={laneHeight}
                rx={6}
                fill={colors.solutionBg}
                stroke={colors.solutionAccent}
                strokeWidth="1.2"
              />
              <text
                x={commitX + commitW / 2}
                y={cy + 4}
                fontSize="12"
                fontFamily="monospace"
                fill={colors.solutionAccent}
                textAnchor="middle"
              >
                {lane.id}
              </text>
            </motion.g>
          </g>
        );
      })}
    </svg>
  );
}

function PipelineSlide({ shouldReduceMotion }: SlideProps) {
  const slotW = 96;
  const slotGap = 16;
  const startX = 116;
  const slotX = (i: number) => startX + i * (slotW + slotGap);
  const blockH = 76;
  const consensusY = 70;
  const executionY = 200;

  const consensusBlocks = [
    { col: 0, label: "N−1" },
    { col: 1, label: "N" },
    { col: 2, label: "N+1" },
    { col: 3, label: "N+2" },
  ];
  const executionBlocks = [
    { col: 1, label: "N−1" },
    { col: 2, label: "N" },
    { col: 3, label: "N+1" },
  ];

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: HERO_EASE };

  return (
    <svg
      role="img"
      aria-label="Top consensus track shows blocks N minus 1, N, N plus 1, and N plus 2; bottom execution track shows the same blocks shifted right by one slot, so execution trails consensus by one block."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <text
        x={28}
        y={consensusY + blockH / 2 + 5}
        fontSize="14"
        fontFamily="monospace"
        fill={colors.userAccent}
      >
        consensus
      </text>
      <text
        x={28}
        y={executionY + blockH / 2 + 5}
        fontSize="14"
        fontFamily="monospace"
        fill={colors.solutionAccent}
      >
        execution
      </text>

      {consensusBlocks.map((b, i) => (
        <motion.g
          key={`c-${b.label}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : i * 0.08 }}
        >
          <rect
            x={slotX(b.col)}
            y={consensusY}
            width={slotW}
            height={blockH}
            rx={10}
            fill={colors.userBg}
            stroke={colors.userAccent}
            strokeWidth="1.5"
          />
          <text
            x={slotX(b.col) + slotW / 2}
            y={consensusY + blockH / 2 + 7}
            fontSize="18"
            fontFamily="monospace"
            textAnchor="middle"
            fill={colors.userAccent}
          >
            {b.label}
          </text>
        </motion.g>
      ))}

      {executionBlocks.map((b, i) => (
        <motion.g
          key={`e-${b.label}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : i * 0.08 + 0.25 }}
        >
          <rect
            x={slotX(b.col)}
            y={executionY}
            width={slotW}
            height={blockH}
            rx={10}
            fill={colors.solutionBg}
            stroke={colors.solutionAccent}
            strokeWidth="1.5"
          />
          <text
            x={slotX(b.col) + slotW / 2}
            y={executionY + blockH / 2 + 7}
            fontSize="18"
            fontFamily="monospace"
            textAnchor="middle"
            fill={colors.solutionAccent}
          >
            {b.label}
          </text>
        </motion.g>
      ))}

      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.75 }}
        transition={{ ...transition, delay: shouldReduceMotion ? 0 : 0.7 }}
      >
        <line
          x1={slotX(2) + slotW / 2}
          x2={slotX(2) + slotW / 2}
          y1={consensusY + blockH + 4}
          y2={executionY - 4}
          stroke={colors.textTertiary}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text
          x={slotX(2) + slotW / 2 + 10}
          y={(consensusY + blockH + executionY) / 2 + 4}
          fontSize="11"
          fontFamily="monospace"
          fill={colors.textTertiary}
        >
          + 1 block
        </text>
      </motion.g>

      <line
        x1={startX - 12}
        x2={slotX(3) + slotW + 12}
        y1={SLIDE_H - 32}
        y2={SLIDE_H - 32}
        stroke={colors.borderSoft}
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <text
        x={slotX(3) + slotW + 12}
        y={SLIDE_H - 14}
        fontSize="10"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="end"
      >
        time →
      </text>
    </svg>
  );
}

type LayerMapHint = { title: string; body: string };

const LAYER_MAP_HINTS: Record<string, LayerMapHint> = {
  surface: {
    title: "EVM surface",
    body: "Transactions, contracts, RPC calls, wallets, and addresses stay Ethereum-compatible. Current mainnet uses the MONAD_NINE / Osaka EVM surface, with documented gas and protocol differences.",
  },
  validators: {
    title: "Validators (MonadBFT)",
    body: "Validators vote on block proposals in pipelined rounds, with a scheduled leader for each round. The flashing dot is the current leader's slot.",
  },
  raptorcast: {
    title: "RaptorCast",
    body: "The leader erasure-codes a proposal into chunks and sends them through two-level broadcast trees. Any sufficiently large subset can rebuild the proposal.",
  },
  parallel: {
    title: "Parallel execution",
    body: "Transactions in a block run concurrently across lanes. Conflicts are detected and replayed before commit, so the result matches a serial run.",
  },
  jit: {
    title: "JIT compile",
    body: "Hot contracts are compiled from EVM bytecode to cached native code, while cold or not-yet-compiled contracts keep running in the interpreter.",
  },
  monaddb: {
    title: "MonadDb",
    body: "A purpose-built database tuned for SSDs, with a persistent on-disk Patricia trie for authenticated blockchain state.",
  },
  result: {
    title: "Canonical block",
    body: "Even though execution ran transactions in parallel, every node arrives at the result of the same serial order: 1 → 2 → 3 → 4.",
  },
};

const DiagramHoverContext = createContext<{
  activeId: string | null;
  setActive: (id: string | null) => void;
  hints: Record<string, LayerMapHint>;
}>({ activeId: null, setActive: () => {}, hints: {} });

function useDiagramHover() {
  return useContext(DiagramHoverContext);
}

const BLOCK_STATES_HINTS: Record<string, LayerMapHint> = {
  proposed: {
    title: "Proposed",
    body: "The block has been proposed but not yet voted. Use for instant UI echoes, while remembering that a proposal can still fail.",
  },
  voted: {
    title: "Voted",
    body: "The observer has a Quorum Certificate for the block, but not QC-squared finality. Good gate before revealing the next step in a multi-step flow.",
  },
  finalized: {
    title: "Finalized",
    body: "Canonical chain state; the docs describe finalized blocks as not revertible without a hard fork. Use for transfers of value or irreversible records.",
  },
  verified: {
    title: "Verified",
    body: "The delayed Merkle root for the block has been finalized. Use when state proofs or root assurance matter.",
  },
};

const METRICS_HINTS: Record<string, LayerMapHint> = {
  throughput: {
    title: "Throughput",
    body: "10k tx/s gives apps more room for onchain interactions before they need offchain batching for responsiveness.",
  },
  "block-frequency": {
    title: "Block frequency",
    body: "Sub-second blocks let users see acknowledgements quickly, before they are likely to retry the action.",
  },
  finality: {
    title: "Finality",
    body: "Full finality arrives in two slots, about 800 ms; speculative finality can arrive in one slot.",
  },
  "gas-throughput": {
    title: "Gas throughput",
    body: "More gas per second leaves more room for contract work before chain capacity shapes the product flow.",
  },
};

const EDGE_HINTS: Record<string, LayerMapHint> = {
  "tail-fork": {
    title: "Tail-fork resistance",
    body: "MonadBFT prevents a leader from forking away its predecessor's block, closing that predecessor-block reorder or replacement attack path.",
  },
  "speculative-exec": {
    title: "Speculative reads",
    body: "Reads like eth_call and eth_estimateGas can run against the latest proposed state instead of waiting for finalized state.",
  },
};

const REALTIME_HINTS: Record<string, LayerMapHint> = {
  "executing-block": {
    title: "Executing block N",
    body: "During speculative execution, the EVM records events for the proposed block before consensus has finalized that block.",
  },
  indexer: {
    title: "Indexer",
    body: "Uses libmonad_event or monad-exec-events to read execution events from shared memory instead of polling JSON-RPC.",
  },
  "explorer-ui": {
    title: "Explorer UI",
    body: "A block explorer or activity feed can stream updates instead of polling JSON-RPC for every new block.",
  },
  "trading-app": {
    title: "Trading app",
    body: "Latency-sensitive apps can prepare work from speculative events, then act or discard it as the block advances through consensus states.",
  },
  "wallet-ui": {
    title: "Wallet UI",
    body: "Wallets can refresh transaction status as commitState advances through Proposed, Voted, Finalized, and Verified. Some blocks can skip Voted.",
  },
  "ipc-card": {
    title: "Shared-memory IPC",
    body: "Local-only fast path. libmonad_event / monad-exec-events read execution events from shared memory on the same host as the node.",
  },
  "ws-card": {
    title: "WebSocket extension",
    body: "Standard JSON-RPC over WebSocket plus Monad-specific subscriptions that include block IDs and commit-state progression.",
  },
};

const BUILD_HINTS: Record<string, LayerMapHint> = {
  "deploy-cmd": {
    title: "Same tools, new RPC",
    body: "Use familiar Solidity workflows with Monad network settings. For local Foundry work, use the Monad Foundry fork so tests match Monad gas, opcode, and precompile behavior.",
  },
  "chain-info": {
    title: "Network constants",
    body: "Chain ID 143, native currency MON. Add as a custom EVM network anywhere that supports one.",
  },
  status: {
    title: "Mainnet live",
    body: "Use the current mainnet constants from Network Information: chain ID 143, MON as native currency, and the listed public RPC endpoints.",
  },
};

const ENGINE_HINTS: Record<string, LayerMapHint> = {
  interleaved: {
    title: "Ethereum-style interleave",
    body: "Shown for contrast. On Ethereum-style chains, leader execution, proposal, validator execution, and voting share one ~12 s slot, so only a fraction is real CPU. Monad's pipeline below skips this trade-off.",
  },
  consensus: {
    title: "Consensus pipeline",
    body: "Every ~400 ms the next leader proposes a block (N, N+1, N+2…) and validators vote. Consensus can keep advancing without waiting for execution of the current block.",
  },
  execution: {
    title: "Execution pipeline",
    body: "Execution runs the previous block while consensus orders the next one. Each block gets the full ~400 ms of CPU instead of a sliced budget.",
  },
  verify: {
    title: "Delayed verification",
    body: "State-root verification lands after the D=3 delayed Merkle root. Some apps can act on finalized blocks; higher-assurance workflows may wait for Verified.",
  },
  "parallel-block": {
    title: "Parallel inside one slot",
    body: "Transactions run concurrently inside one execution slot. Conflicts (tx 2) replay; the recorded order is still 1 → 2 → 3 → 4.",
  },
};

function HoverExplain({
  id,
  className = "",
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeId, setActive, hints } = useDiagramHover();
  const isActive = activeId === id;
  const isDim = activeId !== null && !isActive;
  const hint = hints[id];
  return (
    <div
      tabIndex={0}
      role="group"
      aria-label={hint?.title}
      onMouseEnter={() => setActive(id)}
      onMouseLeave={() => setActive(null)}
      onFocus={() => setActive(id)}
      onBlur={() => setActive(null)}
      className={`rounded-xl outline outline-2 transition-[outline-color,opacity] duration-200 cursor-help focus:outline-solution-accent focus-visible:outline-solution-accent ${
        isActive ? "outline-solution-accent" : "outline-transparent"
      } ${isDim ? "opacity-40" : "opacity-100"} ${className}`}
    >
      {children}
    </div>
  );
}

function DiagramExplainer({
  defaultText = "Hover or focus any layer to see what it does.",
  variant = "sidecar",
}: {
  defaultText?: string;
  variant?: "sidecar" | "compact";
}) {
  const { activeId, hints } = useDiagramHover();
  const hint = activeId ? hints[activeId] : null;
  const sizing =
    variant === "compact"
      ? "min-h-[72px]"
      : "lg:sticky lg:top-6 lg:min-h-[180px]";
  return (
    <aside
      className={`rounded-xl border border-border bg-surface-elevated px-4 py-3 ${sizing}`}
      aria-live="polite"
    >
      {hint ? (
        <>
          <p className="font-mono text-[10px] text-solution-accent tracking-wide uppercase mb-1.5">
            {hint.title}
          </p>
          <p className="text-sm text-text-primary leading-relaxed">
            {hint.body}
          </p>
        </>
      ) : (
        <p className="text-xs text-text-tertiary font-light leading-relaxed">
          {defaultText}
        </p>
      )}
    </aside>
  );
}

function LayerMap() {
  const shouldReduceMotion = !!useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: LAYER_MAP_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6 space-y-3"
          onMouseLeave={() => setActiveId(null)}
        >
          <HoverExplain id="surface">
            <SurfaceRow shouldReduceMotion={shouldReduceMotion} />
          </HoverExplain>
          <Connector label="compiled / called" shouldReduceMotion={shouldReduceMotion} />
          <EngineCard shouldReduceMotion={shouldReduceMotion} />
          <Connector label="canonical block" shouldReduceMotion={shouldReduceMotion} />
          <HoverExplain id="result">
            <ResultRow shouldReduceMotion={shouldReduceMotion} />
          </HoverExplain>
          <div className="flex justify-end pt-2">
            <DocsQRBadge
              src="/qr-identity.svg"
              href="https://docs.monad.xyz/introduction/monad-for-developers"
            />
          </div>
        </div>
        <DiagramExplainer />
      </div>
    </DiagramHoverContext.Provider>
  );
}

const SURFACE_ITEMS = [
  { label: "tx", glyph: "▦" },
  { label: "contract", glyph: "◇" },
  { label: "RPC", glyph: "⇄" },
  { label: "wallet", glyph: "◉" },
];

function SurfaceRow({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-[10px] text-text-tertiary tracking-wide uppercase">
          EVM surface
        </p>
        <span className="font-mono text-[10px] text-text-tertiary">
          Osaka fork <Cite n={17} />
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {SURFACE_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            className="rounded-lg border border-solution-accent-light bg-solution-bg px-2 py-2 text-center"
            animate={frozen ? undefined : { scale: [1, 1.06, 1] }}
            transition={
              frozen
                ? undefined
                : {
                    duration: 0.7,
                    delay: i * 0.25,
                    repeat: Infinity,
                    repeatDelay: 5,
                    ease: "easeInOut",
                  }
            }
          >
            <span className="font-mono text-[11px] text-solution-accent">
              {item.glyph} {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Connector({
  label,
  shouldReduceMotion,
}: {
  label: string;
  shouldReduceMotion: boolean;
}) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  return (
    <div className="flex items-center justify-center py-1">
      <motion.span
        className="font-mono text-[10px] text-text-tertiary flex items-center gap-2"
        animate={frozen ? undefined : { opacity: [0.5, 1, 0.5] }}
        transition={
          frozen
            ? undefined
            : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <span>↓</span>
        <span>{label}</span>
      </motion.span>
    </div>
  );
}

function EngineCard({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  return (
    <div
      className="rounded-xl border-2 p-4 sm:p-5"
      style={{
        borderColor: colors.solutionAccent,
        backgroundColor: colors.solutionBg,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-xs text-solution-accent tracking-wide uppercase">
          Monad L1 engine
        </p>
        <span className="font-mono text-[10px] text-solution-accent border border-solution-accent-light rounded-full px-2 py-0.5">
          this page
        </span>
      </div>

      <div className="space-y-1.5 -mx-1.5">
        <HoverExplain id="validators" className="px-1.5 py-1">
          <EngineSubsystem
            label={
              <>
                validators (BFT)<Cite n={2} />
              </>
            }
          >
            <ValidatorDots shouldReduceMotion={shouldReduceMotion} />
          </EngineSubsystem>
        </HoverExplain>
        <HoverExplain id="raptorcast" className="px-1.5 py-1">
          <EngineSubsystem
            label={
              <>
                RaptorCast<Cite n={3} />
              </>
            }
          >
            <RaptorCastChunks shouldReduceMotion={shouldReduceMotion} />
          </EngineSubsystem>
        </HoverExplain>
        <HoverExplain id="parallel" className="px-1.5 py-1">
          <EngineSubsystem
            label={
              <>
                parallel exec<Cite n={5} />
              </>
            }
          >
            <ParallelLanes shouldReduceMotion={shouldReduceMotion} />
          </EngineSubsystem>
        </HoverExplain>
        <HoverExplain id="jit" className="px-1.5 py-1">
          <EngineSubsystem
            label={
              <>
                JIT compile<Cite n={11} />
              </>
            }
          >
            <JITStream shouldReduceMotion={shouldReduceMotion} />
          </EngineSubsystem>
        </HoverExplain>
        <HoverExplain id="monaddb" className="px-1.5 py-1">
          <EngineSubsystem
            label={
              <>
                MonadDb<Cite n={9} />
              </>
            }
          >
            <MonadDbGrid shouldReduceMotion={shouldReduceMotion} />
          </EngineSubsystem>
        </HoverExplain>
      </div>
    </div>
  );
}

function EngineSubsystem({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 items-center">
      <span className="font-mono text-[10px] text-solution-accent">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function ValidatorDots({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  const count = 7;
  const cycleSec = 5;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: count }).map((_, i) => {
        const peak = 0.05 + (i / count) * 0.75;
        return (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colors.solutionAccent, opacity: 0.4 }}
            animate={
              frozen
                ? undefined
                : {
                    scale: [1, 1, 1.7, 1, 1],
                    opacity: [0.4, 0.4, 1, 0.4, 0.4],
                  }
            }
            transition={
              frozen
                ? undefined
                : {
                    duration: cycleSec,
                    times: [0, Math.max(0.001, peak - 0.02), peak, peak + 0.02, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        );
      })}
    </div>
  );
}

function RaptorCastChunks({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean;
}) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  const count = 4;
  const cycleSec = 3.2;
  return (
    <div className="relative h-2 rounded-full overflow-hidden bg-solution-accent-light/40">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-2 rounded-full"
          style={{ backgroundColor: colors.solutionAccent, width: 14 }}
          initial={{ left: "-15%" }}
          animate={frozen ? undefined : { left: ["-15%", "115%"] }}
          transition={
            frozen
              ? undefined
              : {
                  duration: cycleSec,
                  delay: i * (cycleSec / count),
                  repeat: Infinity,
                  ease: "linear",
                }
          }
        />
      ))}
    </div>
  );
}

function ParallelLanes({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  const cycleSec = 4;
  return (
    <div className="space-y-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: `${colors.solutionAccentLight}` }}
        >
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ backgroundColor: colors.solutionAccent }}
            initial={{ scaleX: 0 }}
            animate={frozen ? { scaleX: 1 } : { scaleX: [0, 1, 1, 0] }}
            transition={
              frozen
                ? { duration: 0 }
                : {
                    duration: cycleSec,
                    delay: i * 0.18,
                    times: [0, 0.45, 0.85, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        </div>
      ))}
    </div>
  );
}

function JITStream({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  const totalBytes = 18;
  const cycleSec = 4;
  return (
    <div className="flex items-end gap-[3px] h-3">
      {Array.from({ length: totalBytes }).map((_, i) => {
        const peak = 0.05 + (i / totalBytes) * 0.7;
        return (
          <motion.div
            key={i}
            className="w-1 rounded-sm origin-bottom"
            style={{ backgroundColor: colors.solutionAccentLight, height: 6 }}
            animate={
              frozen
                ? undefined
                : {
                    backgroundColor: [
                      colors.solutionAccentLight,
                      colors.solutionAccentLight,
                      colors.solutionAccent,
                      colors.solutionAccent,
                      colors.solutionAccentLight,
                    ],
                    scaleY: [1, 1, 2, 2, 1],
                  }
            }
            transition={
              frozen
                ? undefined
                : {
                    duration: cycleSec,
                    times: [
                      0,
                      Math.max(0.001, peak - 0.02),
                      peak,
                      peak + 0.04,
                      1,
                    ],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        );
      })}
    </div>
  );
}

function MonadDbGrid({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  const cols = 12;
  const rows = 2;
  const total = cols * rows;
  const cycleSec = 5;
  return (
    <div
      className="grid gap-0.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const peak = 0.05 + (i / total) * 0.75;
        return (
          <motion.div
            key={i}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: colors.solutionAccentLight }}
            animate={
              frozen
                ? undefined
                : {
                    backgroundColor: [
                      colors.solutionAccentLight,
                      colors.solutionAccentLight,
                      colors.solutionAccent,
                      colors.solutionAccentLight,
                      colors.solutionAccentLight,
                    ],
                  }
            }
            transition={
              frozen
                ? undefined
                : {
                    duration: cycleSec,
                    times: [0, Math.max(0.001, peak - 0.015), peak, peak + 0.015, 1],
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        );
      })}
    </div>
  );
}

function ResultRow({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const { activeId } = useDiagramHover();
  const frozen = shouldReduceMotion || activeId !== null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-mono text-[10px] text-text-tertiary mb-3 tracking-wide uppercase">
        Canonical block result
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <motion.div
              className="h-7 w-7 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: colors.textPrimary,
                color: colors.surface,
              }}
              animate={frozen ? undefined : { scale: [1, 1.1, 1] }}
              transition={
                frozen
                  ? undefined
                  : {
                      duration: 0.6,
                      delay: i * 0.35,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: "easeInOut",
                    }
              }
            >
              <span className="font-mono text-xs">{n}</span>
            </motion.div>
            {i < 3 && (
              <span className="font-mono text-xs text-text-tertiary">→</span>
            )}
          </div>
        ))}
        <span className="font-mono text-[10px] text-text-tertiary ml-1">
          … serial
        </span>
      </div>
    </div>
  );
}

const ENGINE_CYCLE_MS = 13000;

function EngineDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, isVisible } = useInView(0.18);
  const [cycle, setCycle] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const paused = activeId !== null;

  useEffect(() => {
    if (!isVisible || shouldReduceMotion || paused) return;
    const id = setInterval(() => setCycle((c) => c + 1), ENGINE_CYCLE_MS);
    return () => clearInterval(id);
  }, [isVisible, shouldReduceMotion, paused]);

  const slots = [0, 1, 2, 3];
  const consensusBlocks = ["N−1", "N", "N+1", "N+2"];
  const executionBlocks = [null, "N−1", "N", "N+1"] as const;
  const verifyBlocks = [null, null, null, "N−3"] as const;

  const txs = [
    { label: "tx 1", retry: false },
    { label: "tx 2", retry: true },
    { label: "tx 3", retry: false },
    { label: "tx 4", retry: false },
  ];

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: ENGINE_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          ref={ref}
          className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6"
          onMouseLeave={() => setActiveId(null)}
        >
          <HoverExplain id="interleaved">
            <InterleavedBar cycle={cycle} shouldReduceMotion={shouldReduceMotion} />
          </HoverExplain>

          <div className="mb-4 mt-3 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] text-text-tertiary">
              ↓ Monad: separate swim-lanes, full block time for each
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-1">
            <HoverExplain id="consensus" className="px-1.5 py-1">
              <PipelineRow
                label="consensus"
                tone="user"
                slots={slots}
                values={consensusBlocks}
                cycle={cycle}
                shouldReduceMotion={shouldReduceMotion}
                delayBase={0}
              />
            </HoverExplain>
            <HoverExplain id="execution" className="px-1.5 py-1">
              <PipelineRow
                label="execution"
                tone="solution"
                slots={slots}
                values={[...executionBlocks]}
                cycle={cycle}
                shouldReduceMotion={shouldReduceMotion}
                delayBase={0.7}
                highlightSlot={2}
              />
            </HoverExplain>
            <HoverExplain id="verify" className="px-1.5 py-1">
              <PipelineRow
                label="verify"
                tone="dark"
                slots={slots}
                values={[...verifyBlocks]}
                cycle={cycle}
                shouldReduceMotion={shouldReduceMotion}
                delayBase={1.4}
                trailingNote="3-block delay · ~1.2 s"
              />
            </HoverExplain>
            <div className="pl-[92px] flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] text-text-tertiary">
                time →
              </span>
              <span className="font-mono text-[10px] text-text-tertiary">
                one slot ≈ 400 ms
              </span>
            </div>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] text-text-tertiary">
              ↓ inside execution of block N
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <HoverExplain id="parallel-block">
            <div className="rounded-xl bg-surface border border-border p-4">
              <div className="grid grid-cols-[56px_minmax(0,1fr)_72px] gap-3 mb-3">
                <span className="font-mono text-[10px] text-text-tertiary">
                  block N
                </span>
                <span className="font-mono text-[10px] text-text-tertiary">
                  parallel
                </span>
                <span className="font-mono text-[10px] text-text-tertiary text-center">
                  serial commit
                </span>
              </div>
              <div className="space-y-2.5">
                {txs.map((tx, i) => (
                  <ParallelRow
                    key={tx.label}
                    label={tx.label}
                    retry={tx.retry}
                    commitLabel={String(i + 1)}
                    cycle={cycle}
                    shouldReduceMotion={shouldReduceMotion}
                    delay={4 + i * 0.4}
                  />
                ))}
              </div>
              <p className="mt-4 text-xs text-text-tertiary font-light leading-relaxed">
                Transactions run in parallel; state conflicts re-execute. The
                block&apos;s recorded order is still 1 → 2 → 3 → 4.
              </p>
            </div>
          </HoverExplain>
          <div className="mt-4 flex justify-end">
            <DocsQRBadge
              src="/qr-mechanics.svg"
              href="https://docs.monad.xyz/monad-arch/consensus/asynchronous-execution"
            />
          </div>
        </div>
        <DiagramExplainer />
      </div>
    </DiagramHoverContext.Provider>
  );
}

function InterleavedBar({
  cycle,
  shouldReduceMotion,
}: {
  cycle: number;
  shouldReduceMotion: boolean;
}) {
  const segments: { label: string; w: number; color: string }[] = [
    { label: "exec", w: 12, color: colors.problemAccentLight },
    { label: "propose", w: 24, color: colors.userBg },
    { label: "exec", w: 12, color: colors.problemAccentLight },
    { label: "vote", w: 28, color: colors.problemCell },
  ];

  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] items-start gap-3">
      <span
        className="font-mono text-xs mt-2"
        style={{ color: colors.problemAccentStrong }}
      >
        interleaved
      </span>
      <div className="space-y-1">
        <div
          className="relative h-9 rounded-lg overflow-hidden border flex"
          style={{ borderColor: colors.border }}
        >
          {segments.map((seg, i) => (
            <motion.div
              key={`${i}-${cycle}`}
              initial={shouldReduceMotion ? false : { width: 0 }}
              animate={{ width: `${seg.w}%` }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.45,
                      delay: i * 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="h-full flex items-center justify-center"
              style={{ backgroundColor: seg.color }}
            >
              <span
                className="font-mono text-[9px] whitespace-nowrap"
                style={{ color: colors.textPrimary }}
              >
                {seg.w >= 18 ? seg.label : ""}
              </span>
            </motion.div>
          ))}
        </div>
        <p className="font-mono text-[10px] text-text-tertiary text-right pr-1">
          ~100 ms exec budget per block
        </p>
      </div>
    </div>
  );
}

function PipelineRow({
  label,
  tone,
  slots,
  values,
  cycle,
  shouldReduceMotion,
  delayBase,
  highlightSlot,
  trailingNote,
}: {
  label: string;
  tone: "user" | "solution" | "dark";
  slots: number[];
  values: (string | null)[];
  cycle: number;
  shouldReduceMotion: boolean;
  delayBase: number;
  highlightSlot?: number;
  trailingNote?: string;
}) {
  const toneStyles = {
    user: {
      labelColor: colors.userAccent,
      blockBg: colors.userBg,
      blockBorder: colors.userAccent,
      textColor: colors.userAccent,
    },
    solution: {
      labelColor: colors.solutionAccent,
      blockBg: colors.solutionBg,
      blockBorder: colors.solutionAccent,
      textColor: colors.solutionAccent,
    },
    dark: {
      labelColor: colors.textPrimary,
      blockBg: colors.surface,
      blockBorder: colors.textPrimary,
      textColor: colors.textPrimary,
    },
  }[tone];

  return (
    <div className="grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3">
      <span
        className="font-mono text-xs"
        style={{ color: toneStyles.labelColor }}
      >
        {label}
      </span>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot) => {
          const value = values[slot];
          if (!value) {
            return <div key={slot} className="h-10" />;
          }
          return (
            <motion.div
              key={`${slot}-${cycle}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 1.5,
                      delay: delayBase + slot * 0.25,
                      ease: [0.16, 1, 0.3, 1],
                    }
              }
              className="h-10 rounded-lg border flex items-center justify-center"
              style={{
                backgroundColor: toneStyles.blockBg,
                borderColor: toneStyles.blockBorder,
                borderWidth: highlightSlot === slot ? 2 : 1,
              }}
            >
              <span
                className="font-mono text-sm"
                style={{ color: toneStyles.textColor }}
              >
                {value}
              </span>
            </motion.div>
          );
        })}
      </div>
      {trailingNote && (
        <div className="col-start-2 flex justify-end">
          <span className="font-mono text-[9px] text-text-tertiary mt-0.5">
            {trailingNote}
          </span>
        </div>
      )}
    </div>
  );
}

function ParallelRow({
  label,
  retry,
  commitLabel,
  cycle,
  shouldReduceMotion,
  delay,
}: {
  label: string;
  retry: boolean;
  commitLabel: string;
  cycle: number;
  shouldReduceMotion: boolean;
  delay: number;
}) {
  const ease = [0.16, 1, 0.3, 1] as const;
  const reduced = shouldReduceMotion;

  return (
    <div className="grid grid-cols-[56px_minmax(0,1fr)_72px] items-center gap-3">
      <span className="font-mono text-xs text-text-primary">{label}</span>
      <div className="relative h-6 rounded-full bg-border/50 overflow-hidden">
        {retry && (
          <motion.div
            key={`retry-${cycle}`}
            initial={reduced ? false : { width: 0 }}
            animate={{ width: reduced ? "100%" : "44%" }}
            transition={
              reduced ? { duration: 0 } : { duration: 1.7, delay, ease }
            }
            className="absolute inset-y-0 left-0 origin-left rounded-full"
            style={{ backgroundColor: colors.problemAccentLight }}
          />
        )}
        <motion.div
          key={`main-${cycle}`}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: "100%" }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 2.3,
                  delay: retry ? delay + 1.2 : delay,
                  ease,
                }
          }
          className="absolute inset-y-0 left-0 origin-left rounded-full"
          style={{ backgroundColor: colors.solutionAccent }}
        />
        {retry && !reduced && (
          <motion.span
            key={`label-${cycle}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 1.4,
              delay: delay + 0.85,
              times: [0, 0.2, 0.75, 1],
            }}
            className="absolute top-1/2 left-[42%] -translate-y-1/2 font-mono text-[9px] text-surface px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ backgroundColor: colors.problemAccentStrong }}
          >
            conflict → re-run
          </motion.span>
        )}
      </div>
      <motion.div
        key={`commit-${cycle}`}
        initial={reduced ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : {
                duration: 1.2,
                delay: retry ? delay + 3.7 : delay + 2.4,
                ease,
              }
        }
        className="h-7 rounded-md flex items-center justify-center"
        style={{
          backgroundColor: colors.solutionBg,
          border: `1px solid ${colors.solutionAccent}`,
        }}
      >
        <span
          className="font-mono text-xs"
          style={{ color: colors.solutionAccent }}
        >
          {commitLabel}
        </span>
      </motion.div>
    </div>
  );
}

function MetricsDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.4);
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: METRICS_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          ref={ref}
          className="space-y-3"
          onMouseLeave={() => setActiveId(null)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {METRICS.map((metric, index) => (
              <HoverExplain
                key={metric.label}
                id={metric.label.toLowerCase().replace(/\s+/g, "-")}
              >
                <MetricCard
                  metric={metric}
                  index={index}
                  shouldReduceMotion={shouldReduceMotion}
                  enterCount={enterCount}
                />
              </HoverExplain>
            ))}
          </div>
          <div className="flex justify-end">
            <DocsQRBadge
              src="/qr-identity.svg"
              href="https://docs.monad.xyz/introduction/monad-for-developers"
            />
          </div>
        </div>
        <DiagramExplainer defaultText="Hover a metric to see why it matters for product UX." />
      </div>
    </DiagramHoverContext.Provider>
  );
}

function MetricCard({
  metric,
  index,
  shouldReduceMotion,
  enterCount,
}: {
  metric: Metric;
  index: number;
  shouldReduceMotion: boolean;
  enterCount: number;
}) {
  const delay = index * 0.35;
  const fillEnd = METRICS_FILL_SEC / METRICS_CYCLE_SEC;
  const holdEnd = 0.88;
  const monadValue = `${metric.format(metric.target)}${metric.suffix}`;

  return (
    <div className="rounded-xl bg-surface-elevated border border-border p-5">
      <p className="font-mono text-[10px] text-text-tertiary mb-1">
        {metric.label}
      </p>
      <p className="text-2xl font-semibold text-solution-accent tabular-nums mb-1">
        <AnimatedCount
          metric={metric}
          delay={delay}
          fillEnd={fillEnd}
          holdEnd={holdEnd}
          shouldReduceMotion={shouldReduceMotion}
          enterCount={enterCount}
        />
        {metric.suffix}
      </p>
      <div className="rounded-lg border border-border bg-surface px-3 py-2 mb-3 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-text-tertiary">
            Monad
          </span>
          <span className="font-mono text-[10px] text-solution-accent tabular-nums">
            {monadValue}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] text-text-tertiary">
            Ethereum
          </span>
          <span className="font-mono text-[10px] text-text-secondary tabular-nums">
            {metric.ethereum}
          </span>
        </div>
      </div>
      <p className="text-xs text-text-secondary font-light leading-relaxed">
        {metric.note}
      </p>
    </div>
  );
}

function AnimatedCount({
  metric,
  delay,
  fillEnd,
  holdEnd,
  shouldReduceMotion,
  enterCount,
}: {
  metric: Metric;
  delay: number;
  fillEnd: number;
  holdEnd: number;
  shouldReduceMotion: boolean;
  enterCount: number;
}) {
  const mv = useMotionValue(shouldReduceMotion ? metric.target : 0);
  const [text, setText] = useState(metric.format(shouldReduceMotion ? metric.target : 0));

  useEffect(() => {
    if (shouldReduceMotion) {
      mv.set(metric.target);
      setText(metric.format(metric.target));
      return;
    }
    mv.set(0);
    setText(metric.format(0));
    const unsubscribe = mv.on("change", (v) => setText(metric.format(v)));
    const controls = animate(mv, [0, metric.target, metric.target, 0], {
      duration: METRICS_CYCLE_SEC,
      delay,
      times: [0, fillEnd, holdEnd, 1],
      repeat: Infinity,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [mv, metric, delay, fillEnd, holdEnd, shouldReduceMotion, enterCount]);

  return <>{text}</>;
}

const LIST_CYCLE_SEC = 8;
const LIST_WAVE_SPAN = 5;

function List({ items }: { items: ReactNode[] }) {
  const shouldReduceMotion = !!useReducedMotion();
  const slotDuration = LIST_WAVE_SPAN / items.length;
  const pulseHalf = 0.4;

  return (
    <ul className="space-y-3">
      {items.map((item, i) => {
        const peakSec = i * slotDuration + slotDuration / 2;
        const startSec = Math.max(0.01, peakSec - pulseHalf);
        const endSec = peakSec + pulseHalf;
        const times = [
          0,
          startSec / LIST_CYCLE_SEC,
          peakSec / LIST_CYCLE_SEC,
          endSec / LIST_CYCLE_SEC,
          1,
        ];

        return (
          <li
            key={i}
            className="flex gap-3 text-sm text-text-secondary leading-relaxed"
          >
            <motion.span
              className="mt-1.5 h-1.5 w-1.5 rounded-full bg-text-tertiary shrink-0"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: [1, 1, 1.6, 1, 1],
                      backgroundColor: [
                        colors.textTertiary,
                        colors.textTertiary,
                        colors.solutionAccent,
                        colors.textTertiary,
                        colors.textTertiary,
                      ],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: LIST_CYCLE_SEC,
                      times,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            />
            <span>{item}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ClosingSection() {
  const { presenterMode } = usePresenter();
  return (
    <section className="slide min-h-screen px-6 py-20 flex items-center bg-surface">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)] gap-8 lg:gap-14 mb-14">
          <div>
            <SectionEyebrow large={presenterMode}>08 / Porting</SectionEyebrow>
            <h2
              className={`${
                presenterMode
                  ? "text-4xl sm:text-5xl md:text-6xl mb-6"
                  : "text-2xl sm:text-3xl mb-4 text-balance"
              } font-semibold leading-tight`}
            >
              Before you ship, re-audit these
            </h2>
            {!presenterMode && (
              <p className="text-base text-text-secondary font-light leading-relaxed">
                The EVM surface carries over. The assumptions underneath it need
                a second pass — timing, gas, indexing, mempool, and the meaning
                of block tags.
              </p>
            )}
          </div>
          <div className="rounded-xl bg-surface-elevated border border-border p-5 sm:p-6 space-y-4">
            <List
              items={[
                <>
                  Gas is charged by limit, not by usage<Cite n={7} />
                </>,
                <>
                  Block tags map to states:{" "}
                  <span className="font-mono text-[11px] text-solution-accent">
                    latest
                  </span>{" "}
                  /{" "}
                  <span className="font-mono text-[11px] text-solution-accent">
                    pending
                  </span>{" "}
                  /{" "}
                  <span className="font-mono text-[11px] text-solution-accent">
                    safe
                  </span>{" "}
                  /{" "}
                  <span className="font-mono text-[11px] text-solution-accent">
                    finalized
                  </span>
                  <Cite n={[6, 15]} />
                </>,
                <>
                  If account B had zero MON before A funded it, wait for the
                  receipt, then another ~1.2 s before B sends<Cite n={4} />
                </>,
                <>
                  EIP-4844 blob transactions are not supported<Cite n={8} />
                </>,
                <>
                  No global mempool; transactions forward to upcoming leaders
                  <Cite n={8} />
                </>,
                <>
                  Contract size up to 128 KB (Ethereum: 24 KB)<Cite n={8} />
                </>,
                <>
                  Transactions that decrement delegated EOAs and end below 10 MON revert
                  <Cite n={10} />
                </>,
              ]}
            />
            <div className="flex justify-end pt-1">
              <DocsQRBadge
                src="/qr-differences.svg"
                href="https://docs.monad.xyz/developer-essentials/differences"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-10">
          <h3 className="text-2xl font-semibold mb-6">Where next</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NextCard
              href="/mip-4"
              title="Review reserve-balance cases"
              body="Zero-balance funding delay and delegated-EOA reserve checks."
              index={0}
            />
            <NextCard
              href="https://docs.monad.xyz/developer-essentials/summary"
              title="Deploy deliberately"
              body="Port contracts and infra assumptions."
              external
              index={1}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function NextCard({
  href,
  title,
  body,
  external,
  index,
}: {
  href: string;
  title: string;
  body: string;
  external?: boolean;
  index: number;
}) {
  const shouldReduceMotion = !!useReducedMotion();
  const className =
    "group block rounded-xl bg-surface-elevated border border-border p-5 hover:border-text-tertiary/50 transition-colors h-full";
  const content = (
    <>
      <h3 className="text-lg font-semibold mb-3 group-hover:text-solution-accent transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-secondary font-light leading-relaxed mb-4">
        {body}
      </p>
      <span className="font-mono text-xs text-text-tertiary group-hover:text-text-primary transition-colors inline-flex items-center gap-1">
        Open
        <motion.span
          className="inline-block"
          animate={
            shouldReduceMotion ? undefined : { x: [0, 4, 0] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 3.5,
                  delay: index * 1.4,
                  times: [0, 0.4, 1],
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          →
        </motion.span>
      </span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
