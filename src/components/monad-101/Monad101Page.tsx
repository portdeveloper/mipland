"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { ReactNode, RefObject } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInView } from "@/components/useInView";
import { colors } from "@/lib/colors";

// A Stepper lets an animated slide intercept presenter next/prev navigation:
// next()/prev() return true if the slide consumed the key (advanced its own
// internal step), or false to let the deck scroll to the adjacent section.
type Stepper = {
  next: () => boolean;
  prev: () => boolean;
};

type PresenterCtx = {
  presenterMode: boolean;
  currentSlide: number;
  totalSlides: number;
  helpOpen: boolean;
  closeHelp: () => void;
  setStepper: (stepper: Stepper | null) => void;
};

const PresenterContext = createContext<PresenterCtx>({
  presenterMode: false,
  currentSlide: 0,
  totalSlides: 0,
  helpOpen: false,
  closeHelp: () => {},
  setStepper: () => {},
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
    title: "Transaction Lifecycle in Monad",
    url: "https://docs.monad.xyz/monad-arch/transaction-lifecycle",
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
      <Image
        src={src}
        alt={label}
        width={size}
        height={size}
        unoptimized
        className="block opacity-80 group-hover:opacity-100 transition-opacity"
      />
      <span className="font-mono text-[9px] font-medium text-text-tertiary group-hover:text-text-primary transition-colors uppercase tracking-wide">
        {label}
      </span>
    </a>
  );
}

type SectionQR = {
  src: string;
  href: string;
  label?: string;
};

function SectionQRBadge({ qr }: { qr?: SectionQR }) {
  if (!qr) return null;
  return (
    <div className="hidden lg:flex justify-start">
      <DocsQRBadge src={qr.src} href={qr.href} label={qr.label} size={96} />
    </div>
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

function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        className="h-5 w-5 rounded-full border border-solution-accent-light bg-surface-elevated font-mono text-xs leading-none text-solution-accent"
      >
        ?
      </button>
      <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface-elevated px-3 py-2 text-left text-xs leading-relaxed text-text-primary opacity-0 shadow-sm transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {children}
      </span>
    </span>
  );
}

type Metric = {
  label: string;
  target: number;
  format: (v: number) => string;
  suffix: string;
  note: string;
  help?: string;
};

const METRICS: Metric[] = [
  {
    label: "Throughput",
    target: 10000,
    format: (v) => Math.round(v).toLocaleString(),
    suffix: " tx/s",
    note: "More onchain interactions fit inside one product flow.",
  },
  {
    label: "Block frequency",
    target: 400,
    format: (v) => Math.round(v).toString(),
    suffix: " ms",
    note: "Fast enough for subsecond feedback instead of loading screens.",
  },
  {
    label: "Finality",
    target: 800,
    format: (v) => Math.round(v).toString(),
    suffix: " ms",
    note: "Irreversible product decisions can settle quickly.",
  },
  {
    label: "Gas throughput",
    target: 500,
    format: (v) => `${Math.round(v)}M`,
    suffix: " gas/s",
    note: "More contract work can happen without hiding chain latency.",
  },
];

export default function Monad101Page() {
  const [presenterMode, setPresenterMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(6);
  const [helpOpen, setHelpOpen] = useState(false);
  // The currently-visible animated slide registers a stepper here so presenter
  // navigation advances its internal steps before scrolling to the next slide.
  const stepperRef = useRef<Stepper | null>(null);
  const setStepper = useCallback((stepper: Stepper | null) => {
    stepperRef.current = stepper;
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("monad101-present") === "1";
    const url = new URLSearchParams(window.location.search);
    if (url.get("present") !== "1" && !saved) return;
    const id = window.setTimeout(() => setPresenterMode(true), 0);
    return () => window.clearTimeout(id);
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
    const totalSlidesId = window.setTimeout(
      () => setTotalSlides(sections.length),
      0
    );
    if (sections.length === 0) {
      return () => window.clearTimeout(totalSlidesId);
    }
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
    return () => {
      window.clearTimeout(totalSlidesId);
      observer.disconnect();
    };
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
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
      // Let an animated slide step through its own stages first; only scroll to
      // the adjacent section once it has nothing left to reveal.
      if (isNext && stepperRef.current?.next()) return;
      if (isPrev && stepperRef.current?.prev()) return;
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
        setStepper,
      }}
    >
      <main className="bg-surface text-text-primary [text-rendering:optimizeLegibility]">
        <Hero />

      <VisualSection
        tone="alt"
        title="Build like EVM. Deploy to Monad."
        qr={{
          src: "/qr-identity.svg",
          href: "https://docs.monad.xyz/introduction/monad-for-developers",
        }}
        copy={
          <p>
            Monad keeps the developer-facing Ethereum surface: Fusaka EVM
            bytecode, Ethereum-style transactions and accounts, familiar
            wallets, and full Ethereum RPC compatibility<Cite n={[1, 8, 16]} />.
            For most workflows, it feels like adding another EVM network:
            chain ID 143, MON, and a Monad RPC endpoint<Cite n={13} />.
          </p>
        }
      >
        <EvmCompatibilityDiagram />
      </VisualSection>

      <VisualSection
        tone="surface"
        title="MonadBFT makes fast blocks safe to trust"
        qr={{
          src: "/qr-monad-bft.svg",
          href: "https://docs.monad.xyz/monad-arch/consensus/monad-bft",
        }}
        copy={
          <>
            <p>
              MonadBFT is Monad&apos;s consensus protocol: validators agree on a
              single block order quickly, while the protocol prevents a leader
              from forking away its predecessor&apos;s block<Cite n={[1, 2]} />.
            </p>
            <p className="mt-3">
              That gives applications a practical confidence ladder: Proposed
              for fast feedback, speculative finality after one round, Finalized
              for irreversible app logic, and Verified when state-root assurance
              matters<Cite n={[6, 14]} />.
            </p>
          </>
        }
      >
        <MonadBftFeatureDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        title="Move big blocks without making the leader the bottleneck"
        qr={{
          src: "/qr-docs.svg",
          href: "https://docs.monad.xyz/monad-arch/consensus/raptorcast",
        }}
        copy={
          <p>
            RaptorCast breaks a block proposal into erasure-coded chunks and
            sends those chunks through two-hop broadcast trees, using the upload
            bandwidth of the validator network instead of relying on one leader
            to upload the full block to everyone<Cite n={3} />.
          </p>
        }
      >
        <RaptorCastFeatureDiagram />
      </VisualSection>

      <VisualSection
        tone="surface"
        title="Order first. Execute the ordered block locally."
        qr={{
          src: "/qr-mechanics.svg",
          href: "https://docs.monad.xyz/monad-arch/consensus/asynchronous-execution",
        }}
        copy={
          <>
            <p>
              Monad reaches consensus on transaction order before execution
              completes. Once order is fixed, every full node can execute
              locally and deterministically<Cite n={4} />.
            </p>
            <p className="mt-3">
              Execution gets the full block time instead of a sliver of it, and
              each proposal carries a state root from three blocks back, so any
              node that diverges is caught within about 1.2 seconds<Cite n={4} />.
            </p>
          </>
        }
      >
        <EngineDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        title="Run transactions in parallel. Commit them in order."
        qr={{
          src: "/qr-parallel.svg",
          href: "https://docs.monad.xyz/monad-arch/execution/parallel-execution",
        }}
        copy={
          <>
            <p>
              Execution does not crawl through the block one transaction at a
              time. Many executors run transactions optimistically in parallel,
              and the results commit one by one in the original block order
              <Cite n={5} />.
            </p>
            <p className="mt-3">
              If a commit changes state that a later transaction already read,
              that transaction re-executes with most of its inputs cached.
              Contracts always see serial EVM semantics<Cite n={5} />.
            </p>
          </>
        }
      >
        <ParallelExecutionDiagram />
      </VisualSection>

      <VisualSection
        tone="surface"
        title="Compile hot contracts without changing EVM behavior"
        qr={{
          src: "/qr-jit.svg",
          href: "https://docs.monad.xyz/monad-arch/execution/native-compilation",
        }}
        copy={
          <>
            <p>
              Monad executes EVM bytecode with an optimized interpreter and a
              native-code compiler. Frequently used contracts are compiled once,
              cached, and reused by later calls while preserving exact EVM gas
              and error semantics<Cite n={11} />.
            </p>
            <p className="mt-3">
              The compiler removes redundant per-instruction work, folds simple
              constants, and specializes code for where stack values live on the
              machine<Cite n={11} />.
            </p>
          </>
        }
      >
        <JitCompilationDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        title="Store Ethereum state for SSD-speed execution"
        qr={{
          src: "/qr-docs.svg",
          href: "https://docs.monad.xyz/monad-arch/execution/monaddb",
        }}
        copy={
          <p>
            MonadDB stores authenticated Ethereum state in a database designed
            around Merkle Patricia Trie data, async I/O, versioned reads, and
            SSD write patterns. It keeps the EVM state model familiar while
            making the storage layer match Monad&apos;s execution rate<Cite n={9} />.
          </p>
        }
      >
        <MonadDbFeatureDiagram />
      </VisualSection>

      <VisualSection
        tone="surface"
        title="From user click to verified state"
        qr={{
          src: "/qr-lifecycle.svg",
          href: "https://docs.monad.xyz/monad-arch/transaction-lifecycle",
        }}
        copy={
          <>
            <p>
              A Monad transaction starts like an Ethereum transaction, then
              moves through leader forwarding, fast ordered consensus, local
              execution, parallel commit, and delayed state-root verification
              <Cite n={[17, 8, 6]} />.
            </p>
            <p className="mt-3">
              The practical app question is not just &quot;did it land?&quot; It is which
              confidence level your product needs: submitted, proposed,
              finalized, or verified<Cite n={[4, 5, 9]} />.
            </p>
          </>
        }
      >
        <TransactionLifecycleDiagram />
      </VisualSection>

      <VisualSection
        tone="alt"
        title="Reserve balance keeps async execution safe"
        qr={{
          src: "/qr-reserve.svg",
          href: "https://docs.monad.xyz/developer-essentials/reserve-balance",
        }}
        copy={
          <>
            <p>
              Consensus validates new blocks against a delayed state view, so it
              needs a lightweight way to know included transactions can still pay
              for gas. Monad uses a 10 MON reserve budget for EOA gas spend
              across inflight transactions<Cite n={10} />.
            </p>
            <p className="mt-3">
              At execution time, value-spending transactions can revert if an
              account&apos;s ending balance dips below the reserve. Undelegated
              accounts get an emptying exception for normal low-balance usage
              <Cite n={10} />.
            </p>
          </>
        }
      >
        <ReserveBalanceDiagram />
      </VisualSection>

      <WideSection
        tone="surface"
        title="Most app code ports. Recheck the runtime assumptions."
        qr={{
          src: "/qr-differences.svg",
          href: "https://docs.monad.xyz/developer-essentials/differences",
        }}
        copy={
          <p>
            The EVM interface is familiar, but high throughput and asynchronous
            execution change a few assumptions around timing, gas limits, state
            reads, mempool behavior, and real-time infrastructure<Cite n={[8, 14, 15]} />.
          </p>
        }
      >
        <SameDifferentDiagram />
      </WideSection>

      <CtaSection />

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
      <div className="fixed bottom-4 left-20 z-50 hidden sm:block font-mono text-[10px] text-text-tertiary px-2.5 py-1 rounded-full bg-surface-elevated/70 border border-border backdrop-blur-sm pointer-events-none uppercase tracking-wide">
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
    ["→ · Space · PageDown", "next slide / step animation"],
    ["← · PageUp", "previous slide / step back"],
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

function EvmCompatibilityDiagram() {
  const { presenterMode } = usePresenter();
  const familiar = [
    "Solidity",
    "EVM bytecode",
    "20-byte addresses",
    "typed transactions",
    "wallets",
    "JSON-RPC",
    "Monad Foundry",
    "Hardhat",
  ];
  const networkFacts = [
    { label: "Chain ID", value: "143" },
    { label: "Currency", value: "MON" },
    { label: "RPC", value: "https://rpc.monad.xyz" },
    { label: "Explorer", value: "monadvision.com · monadscan.com" },
  ];

  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="rounded-xl bg-surface border border-border p-4">
        <h3
          className={`font-semibold text-text-primary ${
            presenterMode ? "text-2xl" : "text-lg"
          }`}
        >
          Ethereum-shaped tools and contracts
        </h3>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {familiar.map((item) => (
            <div
              key={item}
              className="rounded-lg border border-solution-accent-light bg-solution-bg px-3 py-2 text-center"
            >
              <span
                className={`font-mono text-solution-accent ${
                  presenterMode ? "text-sm" : "text-[11px]"
                }`}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {networkFacts.map((fact) => (
          <div
            key={fact.label}
            className="rounded-lg bg-surface border border-border px-3 py-2"
          >
            <p className="font-mono text-[10px] font-medium text-text-tertiary">
              {fact.label}
            </p>
            <p
              className={`font-mono text-solution-accent break-words ${
                presenterMode ? "text-sm" : "text-xs"
              }`}
            >
              {fact.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonadBftFeatureDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { ref, enterCount } = useEnterCount(0.3);
  const states = [
    { label: "Proposed", timing: "T", use: "UI feedback" },
    { label: "Voted", timing: "T+1", use: "stronger confidence" },
    { label: "Finalized", timing: "T+2", use: "canonical app logic" },
    { label: "Verified", timing: "T+5", use: "state-root assurance" },
  ];
  const metrics = [
    { label: "block time", value: "400 ms" },
    {
      label: "speculative finality",
      value: "1 round",
      help: "A block has enough votes to be very unlikely to change, so apps can usually update UI or low-risk state before full two-round finality.",
    },
    { label: "full finality", value: "800 ms" },
  ];

  return (
    <div
      ref={ref}
      className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6 space-y-5"
    >
      <TailForkPanel
        enterCount={enterCount}
        shouldReduceMotion={shouldReduceMotion}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-solution-accent-light bg-solution-bg px-3 py-2 text-center"
          >
            <div className="flex items-center justify-center gap-1.5">
              <p className="font-mono text-[10px] font-medium text-text-tertiary">
                {metric.label}
              </p>
              {"help" in metric && metric.help && (
                <InfoTooltip label={metric.label}>{metric.help}</InfoTooltip>
              )}
            </div>
            <p className="font-mono text-sm text-solution-accent">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface border border-border p-4">
        <h3 className="text-lg font-semibold text-text-primary mb-3">
          Block confidence states
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {states.map((state, index) => (
            <div
              key={state.label}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[10px] text-solution-accent">
                  {state.timing}
                </span>
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums">
                  {index + 1}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {state.label}
              </p>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                {state.use}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RaptorCastFeatureDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const facts = [
    "Block proposals become erasure-coded chunks.",
    "Each chunk range fans out through a two-hop tree to every validator.",
    "Validators share upload work by stake weight.",
  ];

  return (
    <div className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6">
      <div className="relative w-full" style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}` }}>
        <RaptorCastSlide shouldReduceMotion={shouldReduceMotion} />
      </div>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {facts.map((fact, index) => (
          <div
            key={fact}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <p className="font-mono text-[10px] font-medium text-solution-accent mb-1 tabular-nums">
              0{index + 1}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {fact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const JIT_STEPS = [
  "Cold or rarely used contracts run on the optimized interpreter immediately.",
  "The client tracks cumulative gas. A frequently used contract becomes hot.",
  "Compilation runs asynchronously, so block execution does not wait on compiler latency.",
  "Native code is cached for that exact contract version.",
  "Later calls reuse cached native code while preserving EVM gas and error behavior.",
];

const JIT_MAX_STEP = JIT_STEPS.length - 1;
const JIT_STEP_MS = 2500;

function JitCompilationDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode, setStepper } = usePresenter();
  const { ref, isVisible } = useInView(0.18);
  const initialStep = shouldReduceMotion && !presenterMode ? JIT_MAX_STEP : 0;
  const [step, setStep] = useState(initialStep);
  const [paused, setPaused] = useState(false);
  const stepRef = useRef(initialStep);

  const setStepBoth = useCallback((next: number) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (stepRef.current < JIT_MAX_STEP) {
      setStepBoth(stepRef.current + 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  const goPrev = useCallback(() => {
    if (stepRef.current > 0) {
      setStepBoth(stepRef.current - 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  useEffect(() => {
    if (!presenterMode || !isVisible) return;
    setStepper({ next: goNext, prev: goPrev });
    return () => setStepper(null);
  }, [presenterMode, isVisible, goNext, goPrev, setStepper]);

  useEffect(() => {
    if (presenterMode || shouldReduceMotion || !isVisible || paused) return;
    const id = setInterval(() => {
      setStepBoth((stepRef.current + 1) % (JIT_MAX_STEP + 2));
    }, JIT_STEP_MS);
    return () => clearInterval(id);
  }, [presenterMode, shouldReduceMotion, isVisible, paused, setStepBoth]);

  const renderStep = Math.min(step, JIT_MAX_STEP);
  const stages = [
    { label: "bytecode", body: "EVM contract version", active: renderStep >= 0 },
    { label: "interpreter", body: "runs immediately", active: renderStep >= 0 },
    { label: "hotness", body: "cumulative gas crosses threshold", active: renderStep >= 1 },
    { label: "compiler", body: "async native-code generation", active: renderStep >= 2 },
    { label: "cache", body: "native code reused later", active: renderStep >= 3 },
  ];
  const optimizations = [
    {
      label: "single gas check",
      before: "JUMPDEST · PUSH1 · ADD · PUSH0 · JUMP",
      after: "one straight-line block check",
      active: renderStep >= 2,
    },
    {
      label: "constant folding",
      before: "PUSH1 0x2 · PUSH1 0x3 · ADD",
      after: "internal value: PUSH1 0x5",
      active: renderStep >= 2,
    },
    {
      label: "operand locations",
      before: "stack word in memory/register/vector",
      after: "specialized native sequence",
      active: renderStep >= 3,
    },
  ];

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6"
    >
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {stages.map((stage, index) => (
            <div key={stage.label} className="relative">
              {index < stages.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden sm:block absolute -right-1.5 top-1/2 z-10 -translate-y-1/2 font-mono text-[10px] text-text-tertiary"
                >
                  {"->"}
                </span>
              )}
              <motion.div
                initial={false}
                animate={{
                  opacity: stage.active ? 1 : 0.38,
                  y: stage.active ? 0 : 4,
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                className="h-full rounded-lg border px-3 py-3"
                style={{
                  backgroundColor: stage.active
                    ? colors.solutionBg
                    : colors.surfaceElevated,
                  borderColor: stage.active
                    ? colors.solutionAccent
                    : colors.border,
                }}
              >
                <p className="font-mono text-[10px] font-medium text-solution-accent">
                  {stage.label}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {stage.body}
                </p>
              </motion.div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-2">
          {optimizations.map((item) => (
            <motion.div
              key={item.label}
              initial={false}
              animate={{ opacity: item.active ? 1 : 0.42 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2"
            >
              <p className="font-mono text-[10px] font-medium text-text-primary">
                {item.label}
              </p>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-text-tertiary">
                {item.before}
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-solution-accent">
                {"=>"} {item.after}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex min-h-[40px] flex-col items-start gap-3 sm:flex-row">
          <StepControls
            label="JIT compilation"
            step={renderStep}
            maxStep={JIT_MAX_STEP}
            paused={paused}
            onPrev={goPrev}
            onNext={goNext}
            onTogglePause={() => setPaused((p) => !p)}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={renderStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -4 }
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              className={`text-text-secondary font-normal leading-relaxed ${
                presenterMode ? "text-base" : "text-sm"
              } sm:min-h-[40px]`}
            >
              {JIT_STEPS[renderStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MonadDbFeatureDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode } = usePresenter();
  const { ref, enterCount } = useEnterCount(0.3);
  const points = [
    {
      title: "Readers and the writer never block each other",
      body: "Execution is the only writer. While it builds the next version, consensus and RPC keep reading the previous one. No locks, no half written state, no torn reads.",
    },
    {
      title: "Every read sees a complete, consistent snapshot",
      body: "Old versions stay whole until they age out, so a reader always gets a full picture of state at one point in time, never a mix of old and in flight values.",
    },
    {
      title: "Writes are sequential, which is what SSDs want",
      body: "New node versions append in order instead of overwriting scattered locations. That means cheaper garbage collection, less write amplification, and longer SSD life than the random writes a generic key value store produces.",
    },
  ];

  return (
    <div
      ref={ref}
      className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6 space-y-5"
    >
      <MonadDbAnimatedDiagram
        key={enterCount}
        enterCount={enterCount}
        shouldReduceMotion={shouldReduceMotion}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {points.map((point, index) => (
          <motion.div
            key={`${point.title}-${enterCount}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }
            }
            className="rounded-xl border border-border bg-surface p-4"
          >
            <h3
              className={`font-semibold text-text-primary mb-2 ${
                presenterMode ? "text-xl" : "text-base"
              }`}
            >
              {point.title}
            </h3>
            <p
              className={`text-text-secondary leading-relaxed ${
                presenterMode ? "text-base" : "text-sm"
              }`}
            >
              {point.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const MONADDB_CAPTIONS = [
  "A read walks the trie top down: root, account, slot.",
  "A write targets the slot. Every node on that path needs a new version.",
  "Copy on write: a new branch appears, the old version stays.",
  "New nodes append to SSD in order while readers stay on the old version.",
];

function MonadDbAnimatedDiagram({
  enterCount,
  shouldReduceMotion,
}: {
  enterCount: number;
  shouldReduceMotion: boolean;
}) {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return;
    const id = setInterval(() => setBeat((b) => (b + 1) % 4), 2600);
    return () => clearInterval(id);
  }, [shouldReduceMotion]);

  const showV2 = shouldReduceMotion || beat >= 2;
  const showCopy = !shouldReduceMotion && beat === 2;
  const highlightPath = !shouldReduceMotion && beat === 1;
  const ssdFilled = shouldReduceMotion || beat === 3;
  const showReader = !shouldReduceMotion && (beat === 0 || beat === 3);
  const showWriter = !shouldReduceMotion && beat === 3;

  const v1 = [
    { y: 72, label: "root" },
    { y: 150, label: "acct" },
    { y: 228, label: "slot=5" },
  ];
  const v2 = [
    { y: 72, label: "root*" },
    { y: 150, label: "acct*" },
    { y: 228, label: "slot*=9" },
  ];
  const ssdBlocks = Array.from({ length: 8 }, (_, i) => ({
    x: 476 + (i % 4) * 28,
    y: 120 + Math.floor(i / 4) * 40,
    order: (i % 4) + Math.floor(i / 4) * 4,
  }));

  const rect = (x: number, y: number) => ({ x: x - 31, y: y - 15 });

  return (
    <div className="rounded-xl bg-surface border border-border p-3 sm:p-4">
      <svg
        role="img"
        aria-label="MonadDB stores Ethereum state as a persistent Patricia trie. Updating a slot copies the whole branch to a new version while the old version stays readable, then the new nodes are written to SSD sequentially."
        viewBox="0 0 640 360"
        className="h-auto w-full"
      >
        <defs>
          <marker
            id="monaddb-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={colors.textTertiary} />
          </marker>
        </defs>

        <text x="144" y="30" fontSize="12" fontFamily="monospace" fill={colors.textTertiary} textAnchor="middle">
          persistent state trie
        </text>
        <text x="346" y="30" fontSize="12" fontFamily="monospace" fill={colors.textTertiary} textAnchor="middle">
          MonadDB
        </text>
        <text x="524" y="30" fontSize="12" fontFamily="monospace" fill={colors.textTertiary} textAnchor="middle">
          SSD
        </text>

        {/* v1 edges */}
        <line x1="92" y1="87" x2="92" y2="135" stroke={highlightPath ? colors.solutionAccent : colors.borderSoft} strokeWidth={highlightPath ? 2 : 1.4} />
        <line x1="92" y1="165" x2="92" y2="213" stroke={highlightPath ? colors.solutionAccent : colors.borderSoft} strokeWidth={highlightPath ? 2 : 1.4} />

        {/* v1 nodes (old version, always kept) */}
        {v1.map((node, index) => {
          const r = rect(92, node.y);
          const active = highlightPath;
          return (
            <motion.g
              key={`v1-${node.label}-${enterCount}`}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.35, delay: index * 0.08, ease: HERO_EASE }
              }
            >
              <rect
                x={r.x}
                y={r.y}
                width={62}
                height={30}
                rx={8}
                fill={active ? colors.solutionBg : colors.surfaceElevated}
                stroke={active ? colors.solutionAccent : colors.userAccent}
                strokeWidth="1.5"
              />
              <text
                x={92}
                y={node.y + 4}
                fontSize="10"
                fontFamily="monospace"
                fill={active ? colors.solutionAccent : colors.userAccent}
                textAnchor="middle"
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}

        {/* copy-on-write arrows v1 -> v2 */}
        {v1.map((node, index) => (
          <motion.path
            key={`copy-${index}`}
            d={`M 123 ${node.y} L 165 ${node.y}`}
            stroke={colors.solutionAccent}
            strokeWidth="1.4"
            strokeDasharray="4 4"
            markerEnd="url(#monaddb-arrow)"
            animate={{ opacity: showCopy ? 1 : 0 }}
            transition={{ duration: 0.3, delay: showCopy ? index * 0.12 : 0 }}
          />
        ))}

        {/* v2 edges */}
        <motion.line x1="196" y1="87" x2="196" y2="135" stroke={colors.solutionAccent} strokeWidth="1.5" animate={{ opacity: showV2 ? 1 : 0 }} transition={{ duration: 0.3 }} />
        <motion.line x1="196" y1="165" x2="196" y2="213" stroke={colors.solutionAccent} strokeWidth="1.5" animate={{ opacity: showV2 ? 1 : 0 }} transition={{ duration: 0.3 }} />

        {/* v2 nodes (new version) */}
        {v2.map((node, index) => {
          const r = rect(196, node.y);
          return (
            <motion.g
              key={`v2-${node.label}`}
              animate={{ opacity: showV2 ? 1 : 0, scale: showV2 ? 1 : 0.92 }}
              transition={{ duration: 0.35, delay: showCopy ? index * 0.12 : 0, ease: HERO_EASE }}
            >
              <rect
                x={r.x}
                y={r.y}
                width={62}
                height={30}
                rx={8}
                fill={colors.solutionBg}
                stroke={colors.solutionAccent}
                strokeWidth="1.5"
              />
              <text
                x={196}
                y={node.y + 4}
                fontSize="10"
                fontFamily="monospace"
                fill={colors.solutionAccent}
                textAnchor="middle"
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}

        {/* trie -> MonadDB */}
        <path
          d="M 227 150 L 270 150"
          stroke={colors.textTertiary}
          strokeWidth="1.2"
          strokeDasharray="4 5"
          markerEnd="url(#monaddb-arrow)"
        />

        {/* MonadDB engine */}
        <rect x="276" y="92" width="140" height="116" rx="16" fill={colors.solutionBg} stroke={colors.solutionAccent} strokeWidth="1.5" />
        <text x="346" y="126" fontSize="15" fontFamily="monospace" fill={colors.solutionAccent} textAnchor="middle">
          MonadDB
        </text>
        <text x="346" y="152" fontSize="11" fontFamily="monospace" fill={colors.solutionAccent} textAnchor="middle">
          async I/O
        </text>
        <text x="346" y="176" fontSize="11" fontFamily="monospace" fill={colors.solutionAccent} textAnchor="middle">
          versioned writes
        </text>

        {/* MonadDB -> SSD */}
        <path
          d="M 416 150 L 470 150"
          stroke={colors.textTertiary}
          strokeWidth="1.2"
          strokeDasharray="4 5"
          markerEnd="url(#monaddb-arrow)"
        />

        {/* SSD blocks fill sequentially on write */}
        {ssdBlocks.map((block, index) => (
          <motion.rect
            key={`ssd-${index}`}
            x={block.x}
            y={block.y}
            width="24"
            height="30"
            rx="5"
            stroke={colors.solutionAccent}
            strokeWidth="1"
            animate={{ fill: ssdFilled ? colors.solutionAccent : colors.surfaceElevated }}
            transition={{ duration: 0.25, delay: beat === 3 ? block.order * 0.16 : 0 }}
          />
        ))}
        <text x="524" y="218" fontSize="11" fontFamily="monospace" fill={colors.textTertiary} textAnchor="middle">
          sequential blocks
        </text>

        {/* reader dot: descends v1 root -> acct -> slot */}
        {showReader && (
          <motion.circle
            r="6"
            fill={colors.userAccent}
            initial={{ cx: 92, cy: 72, opacity: 0 }}
            animate={{ cy: [72, 72, 150, 228, 228], opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 2.4, times: [0, 0.1, 0.45, 0.85, 1], ease: "easeInOut" }}
          />
        )}

        {/* writer dot: new branch -> MonadDB -> SSD */}
        {showWriter && (
          <motion.circle
            r="6"
            fill={colors.solutionAccent}
            initial={{ cx: 196, cy: 228, opacity: 0 }}
            animate={{ cx: [196, 196, 346, 490], cy: [228, 228, 150, 150], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4, times: [0, 0.1, 0.55, 1], ease: "easeInOut" }}
          />
        )}

        <text x="20" y="346" fontSize="10" fontFamily="monospace" fill={colors.userAccent}>
          readers: consensus + RPC
        </text>
        <text x="620" y="346" fontSize="10" fontFamily="monospace" fill={colors.solutionAccent} textAnchor="end">
          writer: execution
        </text>

        {!shouldReduceMotion && (
          <text x="320" y="322" fontSize="12" fontFamily="monospace" fill={colors.textSecondary} textAnchor="middle">
            {MONADDB_CAPTIONS[beat]}
          </text>
        )}
      </svg>
    </div>
  );
}

const LIFECYCLE_STAGES = [
  {
    id: "01",
    lane: "User + RPC",
    title: "Submit",
    lines: [
      "Wallet signs tx",
      "RPC accepts the transaction",
      "RPC forwards to next 3 leaders",
    ],
    tone: "user",
  },
  {
    id: "02",
    lane: "Leader + BFT",
    title: "Order",
    lines: [
      "Leader proposes block N",
      "Validators vote on one order",
      "Block moves toward finality",
    ],
    tone: "solution",
  },
  {
    id: "03",
    lane: "Full nodes",
    title: "Execute",
    lines: [
      "Order is fixed first",
      "Nodes execute locally",
      "Parallel results commit serially",
    ],
    tone: "dark",
  },
  {
    id: "04",
    lane: "State",
    title: "Verify",
    lines: [
      "MonadDB writes a new version",
      "Delayed root checks state",
      "Block N becomes Verified",
    ],
    tone: "problem",
  },
];

const CONFIDENCE_STATES = [
  { label: "Submitted", note: "RPC accepted" },
  { label: "Proposed", note: "fast feedback" },
  { label: "Voted", note: "higher confidence" },
  { label: "Finalized", note: "app logic" },
  { label: "Verified", note: "root assurance" },
];

function TransactionLifecycleDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.18);
  const textSize = presenterMode ? "text-base" : "text-sm";
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {LIFECYCLE_STAGES.map((stage, index) => {
          const tone = lifecycleTone(stage.tone);
          return (
            <motion.div
              key={stage.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={isVisible ? { opacity: 1, y: 0 } : undefined}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                delay: shouldReduceMotion ? 0 : index * 0.1,
                ease,
              }}
              className="relative rounded-xl border border-border bg-surface p-4"
            >
              {index < LIFECYCLE_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden md:block absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary"
                >
                  {"->"}
                </span>
              )}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: tone.accent }}
                >
                  {stage.lane}
                </span>
                <span
                  className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
                  style={{
                    backgroundColor: tone.bg,
                    borderColor: tone.border,
                    color: tone.accent,
                  }}
                >
                  {stage.id}
                </span>
              </div>
              <h3 className="mb-3 text-lg font-semibold leading-tight text-text-primary">
                {stage.title}
              </h3>
              <ul className="space-y-2">
                {stage.lines.map((line) => (
                  <li
                    key={line}
                    className={`grid grid-cols-[10px_minmax(0,1fr)] gap-2 ${textSize} leading-relaxed text-text-secondary`}
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: tone.accent }}
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
              App confidence rail
            </p>
            <p className="font-mono text-[10px] text-text-tertiary">
              choose per workflow
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {CONFIDENCE_STATES.map((state, index) => (
              <div
                key={state.label}
                className="relative rounded-lg border border-border bg-surface-elevated px-3 py-2"
              >
                {index < CONFIDENCE_STATES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden sm:block absolute -right-1.5 top-1/2 z-10 -translate-y-1/2 font-mono text-[10px] text-text-tertiary"
                  >
                    {"->"}
                  </span>
                )}
                <p className="font-mono text-[10px] font-medium text-solution-accent">
                  {state.label}
                </p>
                <p className="mt-1 text-xs leading-snug text-text-tertiary">
                  {state.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
            Inside execution
          </p>
          <div className="mt-3 space-y-2">
            {["tx 1", "tx 2", "tx 3", "tx 4"].map((tx, index) => (
              <div
                key={tx}
                className="grid grid-cols-[36px_minmax(0,1fr)_22px] items-center gap-2"
              >
                <span className="font-mono text-[10px] text-text-tertiary">
                  {tx}
                </span>
                <motion.span
                  initial={shouldReduceMotion ? false : { scaleX: 0 }}
                  animate={isVisible ? { scaleX: 1 } : undefined}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.65,
                    delay: shouldReduceMotion ? 0 : 0.35 + index * 0.08,
                    ease,
                  }}
                  className="h-2.5 origin-left rounded-full bg-solution-accent"
                />
                <span className="rounded border border-solution-accent-light bg-solution-bg text-center font-mono text-[10px] text-solution-accent">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            Parallel work, serial commit: 1 → 2 → 3 → 4.
          </p>
        </div>
      </div>
    </div>
  );
}

function lifecycleTone(tone: string) {
  if (tone === "user") {
    return {
      accent: colors.userAccent,
      bg: colors.userBg,
      border: colors.userAccent,
    };
  }
  if (tone === "solution") {
    return {
      accent: colors.solutionAccent,
      bg: colors.solutionBg,
      border: colors.solutionAccent,
    };
  }
  if (tone === "problem") {
    return {
      accent: colors.problemAccentStrong,
      bg: colors.problemBg,
      border: colors.problemAccentStrong,
    };
  }
  return {
    accent: colors.textPrimary,
    bg: colors.surface,
    border: colors.textTertiary,
  };
}

const RESERVE_STEPS = [
  "Consensus validates block N using the state from N-3, because execution intentionally lags.",
  "That lag means consensus may not know whether Alice already spent MON in recent inflight blocks.",
  "Consensus gives each EOA a gas-spend budget: min(10 MON reserve, lagged balance).",
  "Execution then prevents value spend from dipping below the reserve, except for allowed emptying transactions.",
  "Most normal undelegated accounts can still empty once per k blocks; delegated accounts should avoid dipping below 10 MON.",
];

const RESERVE_MAX_STEP = RESERVE_STEPS.length - 1;
const RESERVE_STEP_MS = 2700;

function ReserveBalanceDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode, setStepper } = usePresenter();
  const { ref, isVisible } = useInView(0.18);
  const initialStep =
    shouldReduceMotion && !presenterMode ? RESERVE_MAX_STEP : 0;
  const [step, setStep] = useState(initialStep);
  const [paused, setPaused] = useState(false);
  const stepRef = useRef(initialStep);

  const setStepBoth = useCallback((next: number) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (stepRef.current < RESERVE_MAX_STEP) {
      setStepBoth(stepRef.current + 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  const goPrev = useCallback(() => {
    if (stepRef.current > 0) {
      setStepBoth(stepRef.current - 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  useEffect(() => {
    if (!presenterMode || !isVisible) return;
    setStepper({ next: goNext, prev: goPrev });
    return () => setStepper(null);
  }, [presenterMode, isVisible, goNext, goPrev, setStepper]);

  useEffect(() => {
    if (presenterMode || shouldReduceMotion || !isVisible || paused) return;
    const id = setInterval(() => {
      setStepBoth((stepRef.current + 1) % (RESERVE_MAX_STEP + 2));
    }, RESERVE_STEP_MS);
    return () => clearInterval(id);
  }, [presenterMode, shouldReduceMotion, isVisible, paused, setStepBoth]);

  const renderStep = Math.min(step, RESERVE_MAX_STEP);
  const blocks = [
    { label: "N-3", state: "known state", active: renderStep >= 0 },
    { label: "N-2", state: "inflight", active: renderStep >= 1 },
    { label: "N-1", state: "inflight", active: renderStep >= 1 },
    { label: "N", state: "validating", active: renderStep >= 0 },
  ];

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6"
    >
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-4">
          <div>
            <div className="grid grid-cols-4 gap-2">
              {blocks.map((block, index) => (
                <div key={block.label} className="relative">
                  {index < blocks.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute -right-1.5 top-8 z-10 hidden sm:block font-mono text-[10px] text-text-tertiary"
                    >
                      {"->"}
                    </span>
                  )}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: block.active ? 1 : 0.42,
                      y: block.active ? 0 : 4,
                    }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                    className="rounded-lg border px-3 py-3"
                    style={{
                      backgroundColor:
                        block.label === "N"
                          ? colors.solutionBg
                          : colors.surfaceElevated,
                      borderColor:
                        block.label === "N"
                          ? colors.solutionAccent
                          : colors.border,
                    }}
                  >
                    <p className="font-mono text-[10px] font-medium text-text-primary">
                      block {block.label}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-text-tertiary">
                      {block.state}
                    </p>
                  </motion.div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ReserveCard
                title="Lagged balance"
                value="Alice: 110 MON"
                note="consensus knows N-3"
                active={renderStep >= 0}
              />
              <ReserveCard
                title="Unknown recent spend"
                value="blocks N-2 / N-1"
                note="execution may not be caught up"
                active={renderStep >= 1}
                tone="problem"
              />
              <ReserveCard
                title="Gas budget"
                value="min(10, 110) = 10 MON"
                note="inflight gas spend must fit"
                active={renderStep >= 2}
              />
            </div>

            <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[10px] font-medium text-text-tertiary">
                    consensus-time check
                  </p>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      renderStep >= 2
                        ? "text-text-secondary"
                        : "text-text-tertiary"
                    }`}
                  >
                    Include transactions only while Alice&apos;s inflight gas
                    spend stays within the reserve budget.
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-medium text-text-tertiary">
                    execution-time check
                  </p>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      renderStep >= 3
                        ? "text-text-secondary"
                        : "text-text-tertiary"
                    }`}
                  >
                    Revert value spend that leaves the ending balance below the
                    reserve, unless the emptying exception applies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
              Builder meaning
            </p>
            <div className="mt-3 space-y-2">
              {[
                ["10 MON", "default reserve"],
                ["D = 3", "same async delay window"],
                ["gas limit", "gas spend budget"],
                ["included", "can still revert"],
              ].map(([label, note], index) => (
                <motion.div
                  key={label}
                  initial={false}
                  animate={{ opacity: renderStep >= Math.min(index, 3) ? 1 : 0.4 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                  className="rounded-md border border-border bg-surface px-3 py-2"
                >
                  <p className="font-mono text-xs text-solution-accent">
                    {label}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">{note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex min-h-[40px] flex-col items-start gap-3 sm:flex-row">
          <StepControls
            label="reserve balance"
            step={renderStep}
            maxStep={RESERVE_MAX_STEP}
            paused={paused}
            onPrev={goPrev}
            onNext={goNext}
            onTogglePause={() => setPaused((p) => !p)}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={renderStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -4 }
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              className={`text-text-secondary font-normal leading-relaxed ${
                presenterMode ? "text-base" : "text-sm"
              } sm:min-h-[40px]`}
            >
              {RESERVE_STEPS[renderStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ReserveCard({
  title,
  value,
  note,
  active,
  tone = "solution",
}: {
  title: string;
  value: string;
  note: string;
  active: boolean;
  tone?: "solution" | "problem";
}) {
  const accent =
    tone === "problem" ? colors.problemAccentStrong : colors.solutionAccent;
  const bg = tone === "problem" ? colors.problemBg : colors.solutionBg;
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0.4, y: active ? 0 : 4 }}
      transition={{ duration: 0.25 }}
      className="rounded-lg border px-3 py-3"
      style={{
        backgroundColor: active ? bg : colors.surfaceElevated,
        borderColor: active ? accent : colors.border,
      }}
    >
      <p className="font-mono text-[10px] font-medium text-text-tertiary">
        {title}
      </p>
      <p className="mt-1 font-mono text-sm" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-text-tertiary">{note}</p>
    </motion.div>
  );
}

function SameDifferentDiagram() {
  const sameItems: ReactNode[] = [
    <>Solidity contracts and EVM bytecode stay familiar<Cite n={1} /></>,
    <>Wallets, accounts, signatures, and addresses look like Ethereum<Cite n={1} /></>,
    <>Standard JSON-RPC remains the main app interface<Cite n={[1, 15]} /></>,
    <>Hardhat works with Monad settings; for Foundry, use the Monad Foundry fork<Cite n={16} /></>,
  ];
  const differentItems: ReactNode[] = [
    <>Treat block states as confidence levels: Proposed, Voted, Finalized, Verified<Cite n={6} /></>,
    <>Transactions are charged by gas limit, not gas used<Cite n={7} /></>,
    <><span className="font-mono">latest</span> reads can include proposed state; pick tags deliberately<Cite n={15} /></>,
    <>There is no global mempool; RPC nodes forward to upcoming leaders<Cite n={8} /></>,
    <>Reserve balance rules matter for edge cases like delegated EOAs<Cite n={10} /></>,
    <>Blob transactions are unsupported, and max contract size is 128 KB<Cite n={[8, 14]} /></>,
    <>Indexers and explorers may use WebSockets or execution events instead of polling<Cite n={[12, 14]} /></>,
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl bg-surface-elevated border border-border p-4"
          >
            <p className="font-mono text-[10px] font-medium text-text-tertiary mb-1">
              {metric.label}
            </p>
            <p className="text-xl font-semibold text-solution-accent tabular-nums">
              {metric.format(metric.target)}
              {metric.suffix}
            </p>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              {metric.note}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SameDifferentColumn
          title="What feels the same"
          items={sameItems}
          tone="same"
        />
        <SameDifferentColumn
          title="What deserves a second pass"
          items={differentItems}
          tone="different"
        />
      </div>
    </div>
  );
}

function SameDifferentColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReactNode[];
  tone: "same" | "different";
}) {
  const isSame = tone === "same";
  return (
    <div className="rounded-xl bg-surface-elevated border border-border p-5 sm:p-6">
      <h3 className="text-xl font-semibold text-text-primary mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="grid grid-cols-[22px_minmax(0,1fr)] gap-3">
            <span
              className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border font-mono text-[9px]"
              style={{
                color: isSame ? colors.solutionAccent : colors.problemAccentStrong,
                borderColor: isSame
                  ? colors.solutionAccentLight
                  : colors.problemAccentStrong,
                backgroundColor: isSame ? colors.solutionBg : colors.problemBg,
              }}
            >
              {index + 1}
            </span>
            <span className="text-sm font-normal text-text-secondary leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="rounded-xl bg-surface border border-border p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-3">
        Tail-fork resistance
      </h3>
      <div className="relative overflow-hidden pl-2 pb-2">
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

        {!shouldReduceMotion ? (
          <motion.div
            key={`fork-${enterCount}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [-4, 0, 0, 0],
            }}
            transition={{
              duration: 4.6,
              times: [0, 0.18, 0.78, 1],
              repeat: Infinity,
              repeatDelay: 0.4,
              ease: "easeOut",
            }}
            className="mt-4 flex flex-wrap items-center gap-3 pl-[34%]"
          >
            <span className="text-text-tertiary font-mono text-xs">↳</span>
            <div
              className="min-h-12 px-4 rounded-lg border-2 border-dashed flex items-center relative"
              style={{
                borderColor: colors.problemAccentStrong,
                backgroundColor: colors.problemBg,
              }}
            >
              <span
                className="font-mono text-sm"
                style={{ color: colors.problemAccentStrong }}
              >
                fork attempt
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 0, 1, 1] }}
                transition={{
                  duration: 4.6,
                  times: [0, 0.42, 0.55, 1],
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: "easeOut",
                }}
                className="absolute left-0 right-0 top-1/2 h-[2px] origin-left"
                style={{ backgroundColor: colors.problemAccentStrong }}
              />
            </div>
            <span
              className="rounded-lg bg-solution-bg border border-solution-accent-light px-3 py-2 font-mono text-sm"
              style={{ color: colors.solutionAccent }}
            >
              rejected by MonadBFT
            </span>
          </motion.div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3 pl-[34%]">
            <span className="text-text-tertiary font-mono text-xs">↳</span>
            <div
              className="min-h-12 px-4 rounded-lg border-2 border-dashed flex items-center"
              style={{
                color: colors.problemAccentStrong,
                borderColor: colors.problemAccentStrong,
                backgroundColor: colors.problemBg,
              }}
            >
              <span className="font-mono text-sm">fork attempt</span>
            </div>
            <span className="rounded-lg bg-solution-bg border border-solution-accent-light px-3 py-2 font-mono text-sm text-solution-accent">
              rejected by MonadBFT
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const CTA_LINKS = [
  {
    title: "Monad for developers",
    body: "Chain ID 143, MON, a Monad RPC endpoint, and a quickstart for your first deploy.",
    href: "https://docs.monad.xyz/introduction/monad-for-developers",
    path: "/introduction/monad-for-developers",
  },
  {
    title: "What is different from Ethereum",
    body: "Gas charged by limit, finality tags, no global mempool, and real-time infra patterns.",
    href: "https://docs.monad.xyz/developer-essentials/differences",
    path: "/developer-essentials/differences",
  },
  {
    title: "Architecture deep dives",
    body: "MonadBFT, RaptorCast, async and parallel execution, and MonadDB in full detail.",
    href: "https://docs.monad.xyz/monad-arch",
    path: "/monad-arch",
  },
];

function CtaSection() {
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.15);
  const links = CTA_LINKS;

  if (presenterMode) {
    const qrs = [
      { src: "/qr-docs.svg", href: "https://docs.monad.xyz", label: "docs.monad.xyz" },
      { src: "/qr-x-dev.svg", href: "https://x.com/monad_dev", label: "x.com/monad_dev" },
    ];
    return (
      <section className="slide min-h-screen flex flex-col items-center justify-center px-6 bg-surface text-center">
        <motion.h2
          className="text-5xl sm:text-6xl md:text-7xl font-semibold mb-14 leading-tight tracking-tight"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          Start building on Monad
        </motion.h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-16 sm:gap-28">
          {qrs.map((qr, index) => (
            <motion.a
              key={qr.href}
              href={qr.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{
                duration: 0.7,
                delay: 0.18 + index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group flex flex-col items-center gap-4"
            >
              <Image
                src={qr.src}
                alt={`QR code to ${qr.label}`}
                width={260}
                height={260}
                unoptimized
                className="block"
              />
              <span className="font-mono text-lg text-text-tertiary group-hover:text-solution-accent transition-colors">
                {qr.label}
              </span>
            </motion.a>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface border-t border-border px-6 py-24">
      <div
        ref={ref}
        className={`max-w-7xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold leading-tight mb-4 text-balance">
            Start building on Monad
          </h2>
          <p className="text-base text-text-secondary font-normal leading-relaxed">
            Same contracts, wallets, and RPC, on a new high-throughput core. You
            have the mental model. Here is where to go next.
          </p>
          <div className="mt-6">
            <a
              href="https://docs.monad.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-solution-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-solution-accent/90"
            >
              Read the docs
              <span aria-hidden="true">{"->"}</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-solution-accent"
            >
              <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-1.5">
                {link.title}
                <span
                  aria-hidden="true"
                  className="text-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-solution-accent"
                >
                  {"->"}
                </span>
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {link.body}
              </p>
            </a>
          ))}
        </div>
      </div>
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
        <p className="font-mono text-[11px] font-medium text-text-tertiary tracking-wide mb-5 uppercase">
          References
        </p>
        <ol className="space-y-2.5 text-sm text-text-secondary font-normal">
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
    <section
      className={`slide ${
        presenterMode ? "min-h-screen" : "min-h-[75vh]"
      } flex flex-col items-center justify-center px-6 relative overflow-hidden`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`text-center max-w-4xl relative z-10 ${
          presenterMode ? "mt-0" : "mt-30"
        }`}
      >
        <h1
          className={`${
            presenterMode
              ? "text-5xl sm:text-6xl md:text-7xl"
              : "text-4xl sm:text-5xl md:text-6xl"
          } font-normal leading-[1.1] tracking-tight mb-6`}
        >
          Monad:{" "}
          <span className="font-semibold italic">
            a familiar EVM surface with a new high-throughput core.
          </span>
        </h1>
        {!presenterMode && (
          <p className="text-lg sm:text-xl text-text-secondary font-normal max-w-xl mx-auto leading-relaxed">
            Same contracts, wallets, and RPC. Underneath: MonadBFT, RaptorCast,
            async and parallel execution, and MonadDB.
          </p>
        )}
      </motion.div>

      <div className="mt-16 mb-16 relative z-10 w-full max-w-4xl">
        <PipelineHeroVisual />
      </div>
    </section>
  );
}

function VisualSection({
  title,
  copy,
  children,
  tone = "alt",
  qr,
}: {
  title: string;
  copy: ReactNode;
  children: ReactNode;
  tone?: "alt" | "surface";
  qr?: SectionQR;
}) {
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.12);
  const layout = presenterMode
    ? "lg:grid-cols-[96px_minmax(0,0.9fr)_minmax(0,1.2fr)]"
    : "lg:grid-cols-[96px_minmax(0,0.62fr)_minmax(0,1.38fr)]";
  const maxWidth = presenterMode ? "max-w-[92rem]" : "max-w-7xl";

  return (
    <section
      className={`slide min-h-screen px-6 py-20 flex items-center ${tone === "alt" ? "bg-surface-alt" : "bg-surface"}`}
    >
      <div
        ref={ref}
        className={`w-full ${maxWidth} mx-auto grid grid-cols-1 ${layout} gap-9 lg:gap-10 xl:gap-14 items-start section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <SectionQRBadge qr={qr} />
        <div>
          <h2
            className={`${
              presenterMode
                ? "text-5xl sm:text-6xl md:text-7xl mb-7"
                : "text-2xl sm:text-3xl mb-4 text-balance"
            } font-semibold leading-tight`}
          >
            {title}
          </h2>
          <div
            className={`text-text-secondary font-normal leading-relaxed ${
              presenterMode ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {copy}
          </div>
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
  qr,
}: {
  title: string;
  copy: ReactNode;
  children: ReactNode;
  tone?: "alt" | "surface";
  qr?: SectionQR;
}) {
  const { presenterMode } = usePresenter();
  const { ref, isVisible } = useInView(0.12);
  const layout = presenterMode
    ? "lg:grid-cols-[96px_minmax(0,1fr)]"
    : "lg:grid-cols-[96px_minmax(0,1fr)]";
  const maxWidth = presenterMode ? "max-w-[92rem]" : "max-w-7xl";
  const textMaxWidth = presenterMode ? "max-w-5xl" : "max-w-3xl";

  return (
    <section
      className={`slide min-h-screen px-6 py-20 flex items-center ${tone === "alt" ? "bg-surface-alt" : "bg-surface"}`}
    >
      <div
        ref={ref}
        className={`w-full ${maxWidth} mx-auto grid grid-cols-1 ${layout} gap-9 lg:gap-10 xl:gap-14 items-start section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <SectionQRBadge qr={qr} />
        <div>
          <div className={`${textMaxWidth} mb-10`}>
            <h2
              className={`${
                presenterMode
                  ? "text-5xl sm:text-6xl md:text-7xl mb-7"
                  : "text-3xl sm:text-4xl mb-4"
              } font-semibold leading-tight`}
            >
              {title}
            </h2>
            <div
              className={`text-text-secondary font-normal leading-relaxed ${
                presenterMode ? "text-xl sm:text-2xl" : "text-base"
              }`}
            >
              {copy}
            </div>
          </div>
          {children}
        </div>
      </div>
    </section>
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
    key: "monadbft",
    title: "MonadBFT",
    note: "tail-fork-resistant consensus with fast finality",
    Component: MonadBftSlide,
  },
  {
    key: "raptorcast",
    title: "RaptorCast",
    note: "erasure-coded chunks through two-hop broadcast trees",
    Component: RaptorCastSlide,
  },
  {
    key: "async",
    title: "Async execution",
    note: "vote first, execute the ordered block locally",
    Component: PipelineSlide,
  },
  {
    key: "monaddb",
    title: "MonadDB",
    note: "trie-native state storage for SSD throughput",
    Component: MonadDbSlide,
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
            <span className="hidden sm:block font-mono text-[11px] text-text-tertiary truncate">
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

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SLIDES.map((s, i) => (
          <button
            type="button"
            key={s.key}
            onClick={() => setSlide(i)}
            aria-pressed={i === slide}
            className={`cursor-pointer rounded-lg border px-3 py-3 text-center transition-colors duration-300 ${
              i === slide
                ? "border-solution-accent bg-solution-bg text-solution-accent"
                : "border-border bg-surface text-text-tertiary hover:text-text-primary hover:border-text-tertiary/50"
            }`}
          >
            <span className="font-mono text-[11px] sm:text-xs font-medium">
              {s.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MonadBftSlide({ shouldReduceMotion }: SlideProps) {
  const rounds = [
    { slot: "T", proposed: "N", voted: "N-1", finalized: "N-2" },
    { slot: "T+1", proposed: "N+1", voted: "N", finalized: "N-1" },
    { slot: "T+2", proposed: "N+2", voted: "N+1", finalized: "N" },
  ];
  const startX = 104;
  const cardW = 132;
  const gap = 42;
  const cardY = 96;

  return (
    <svg
      role="img"
      aria-label="MonadBFT rounds show a proposed block, a voted predecessor, and a finalized grandparent in each pipelined round."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <text
        x={SLIDE_W / 2}
        y={42}
        fontSize="12"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        pipelined consensus rounds
      </text>

      {rounds.map((round, index) => {
        const x = startX + index * (cardW + gap);
        const isFinalRound = index === rounds.length - 1;
        return (
          <motion.g
            key={round.slot}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.45, delay: index * 0.15, ease: HERO_EASE }
            }
          >
            <rect
              x={x}
              y={cardY}
              width={cardW}
              height={150}
              rx={12}
              fill={isFinalRound ? colors.solutionBg : colors.surface}
              stroke={isFinalRound ? colors.solutionAccent : colors.border}
              strokeWidth={isFinalRound ? 1.7 : 1}
            />
            <text
              x={x + cardW / 2}
              y={cardY + 26}
              fontSize="11"
              fontFamily="monospace"
              fill={colors.textTertiary}
              textAnchor="middle"
            >
              {round.slot}
            </text>
            {[
              ["proposed", round.proposed, colors.userAccent],
              ["voted", round.voted, colors.problemAccentStrong],
              ["finalized", round.finalized, colors.solutionAccent],
            ].map(([label, value, color], rowIndex) => (
              <g key={label}>
                <text
                  x={x + 20}
                  y={cardY + 58 + rowIndex * 34}
                  fontSize="10"
                  fontFamily="monospace"
                  fill={colors.textTertiary}
                >
                  {label}
                </text>
                <rect
                  x={x + 84}
                  y={cardY + 43 + rowIndex * 34}
                  width={30}
                  height={22}
                  rx={5}
                  fill={colors.surfaceElevated}
                  stroke={color}
                  strokeWidth="1.2"
                />
                <text
                  x={x + 99}
                  y={cardY + 58 + rowIndex * 34}
                  fontSize="11"
                  fontFamily="monospace"
                  fill={color}
                  textAnchor="middle"
                >
                  {value}
                </text>
              </g>
            ))}
          </motion.g>
        );
      })}

      <motion.path
        d="M 132 274 C 225 310, 410 310, 506 274"
        fill="none"
        stroke={colors.solutionAccent}
        strokeWidth="1.4"
        strokeDasharray="4 6"
        initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 1.1, delay: 0.6, ease: HERO_EASE }
        }
      />
      <text
        x={SLIDE_W / 2}
        y={326}
        fontSize="12"
        fontFamily="monospace"
        fill={colors.solutionAccent}
        textAnchor="middle"
      >
        block N finalized after two rounds
      </text>
    </svg>
  );
}

function RaptorCastSlide({ shouldReduceMotion }: SlideProps) {
  const originator = { x: 96, y: 180 };
  const firstHopNodes = [
    {
      id: "V2",
      x: 300,
      y: 88,
      range: "c0-c2",
      tone: colors.userAccent,
      bg: colors.userBg,
    },
    {
      id: "V5",
      x: 300,
      y: 180,
      range: "c3-c5",
      tone: colors.solutionAccent,
      bg: colors.solutionBg,
    },
    {
      id: "V7",
      x: 300,
      y: 272,
      range: "c6-c8",
      tone: colors.problemAccentStrong,
      bg: colors.problemBg,
    },
  ];
  const secondHopNodes = [
    { id: "V1", x: 540, y: 72 },
    { id: "V3", x: 540, y: 144 },
    { id: "V4", x: 540, y: 216 },
    { id: "V6", x: 540, y: 288 },
  ];

  const chunkPeriod = 1.4;
  const hopTravel = chunkPeriod * 0.9;
  const edges = firstHopNodes.flatMap((node, i) => {
    const leaderDelay = 0.2 + i * 0.15;
    // every first-hop validator relays its chunk range to all other validators
    return [
      { key: `leader-${node.id}`, from: originator, to: node, delay: leaderDelay, tone: node.tone },
      ...secondHopNodes.map((recipient, j) => ({
        key: `${node.id}-${recipient.id}`,
        from: node,
        to: recipient,
        delay: leaderDelay + hopTravel + 0.12 * j,
        tone: node.tone,
      })),
    ].map((edge) => ({
      ...edge,
      dx: edge.to.x - edge.from.x,
      dy: edge.to.y - edge.from.y,
    }));
  });

  const blockW = 84;
  const blockH = 50;
  const chunkSize = 5;

  return (
    <svg
      role="img"
      aria-label="A leader splits a block into erasure-coded chunk ranges and sends each range to a first-hop validator. Every first-hop validator relays its range to all other validators, so each validator collects every range and can decode the block."
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
        x={540}
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
            fill={colors.surfaceElevated}
            stroke={colors.textTertiary}
            strokeWidth="1.3"
          />
          <text
            x={recipient.x}
            y={recipient.y + 4}
            fontSize="10"
            fontFamily="monospace"
            fill={colors.textPrimary}
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
              delay: edge.delay,
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
            fill={node.bg}
            stroke={node.tone}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y + 4}
            fontSize="11"
            fontFamily="monospace"
            fill={node.tone}
            textAnchor="middle"
          >
            {node.id}
          </text>
          <text
            x={node.x}
            y={node.y + 33}
            fontSize="9"
            fontFamily="monospace"
            fill={node.tone}
            textAnchor="middle"
          >
            {node.range}
          </text>
        </g>
      ))}

      <text
        x={SLIDE_W / 2}
        y={346}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textSecondary}
        textAnchor="middle"
      >
        every validator collects chunks from every range, enough to decode
      </text>

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

function MonadDbSlide({ shouldReduceMotion }: SlideProps) {
  const trieNodes = [
    { x: 126, y: 92, label: "root" },
    { x: 78, y: 168, label: "acct" },
    { x: 174, y: 168, label: "slot" },
    { x: 126, y: 244, label: "leaf" },
  ];
  const dbCards = [
    { x: 280, y: 94, label: "async I/O" },
    { x: 280, y: 154, label: "versions" },
    { x: 280, y: 214, label: "atomic writes" },
  ];
  const ssdBlocks = Array.from({ length: 8 }, (_, i) => ({
    x: 466 + (i % 4) * 28,
    y: 132 + Math.floor(i / 4) * 44,
  }));

  return (
    <svg
      role="img"
      aria-label="MonadDB maps Merkle Patricia Trie state into a trie-native database and sequential SSD storage blocks."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <text
        x={126}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        Ethereum state trie
      </text>
      <text
        x={338}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        MonadDB
      </text>
      <text
        x={508}
        y={42}
        fontSize="11"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        SSD layout
      </text>

      <line x1={126} y1={110} x2={78} y2={150} stroke={colors.borderSoft} />
      <line x1={126} y1={110} x2={174} y2={150} stroke={colors.borderSoft} />
      <line x1={78} y1={186} x2={126} y2={226} stroke={colors.borderSoft} />
      <line x1={174} y1={186} x2={126} y2={226} stroke={colors.borderSoft} />
      {trieNodes.map((node, index) => (
        <motion.g
          key={node.label}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.35, delay: index * 0.08, ease: HERO_EASE }
          }
        >
          <circle
            cx={node.x}
            cy={node.y}
            r={22}
            fill={colors.surface}
            stroke={colors.userAccent}
            strokeWidth="1.4"
          />
          <text
            x={node.x}
            y={node.y + 4}
            fontSize="10"
            fontFamily="monospace"
            fill={colors.userAccent}
            textAnchor="middle"
          >
            {node.label}
          </text>
        </motion.g>
      ))}

      <path
        d="M 218 170 L 256 170"
        stroke={colors.textTertiary}
        strokeWidth="1.2"
        strokeDasharray="3 5"
      />
      {dbCards.map((card, index) => (
        <motion.g
          key={card.label}
          initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.45, delay: 0.25 + index * 0.11, ease: HERO_EASE }
          }
        >
          <rect
            x={card.x}
            y={card.y}
            width={116}
            height={38}
            rx={8}
            fill={colors.solutionBg}
            stroke={colors.solutionAccent}
            strokeWidth="1.3"
          />
          <text
            x={card.x + 58}
            y={card.y + 24}
            fontSize="11"
            fontFamily="monospace"
            fill={colors.solutionAccent}
            textAnchor="middle"
          >
            {card.label}
          </text>
        </motion.g>
      ))}

      <path
        d="M 416 170 L 452 170"
        stroke={colors.textTertiary}
        strokeWidth="1.2"
        strokeDasharray="3 5"
      />
      {ssdBlocks.map((block, index) => (
        <motion.rect
          key={index}
          x={block.x}
          y={block.y}
          width={22}
          height={34}
          rx={4}
          fill={index < 5 ? colors.solutionAccent : colors.solutionBg}
          stroke={colors.solutionAccent}
          strokeWidth="1"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.35, delay: 0.55 + index * 0.05, ease: HERO_EASE }
          }
        />
      ))}
      <text
        x={508}
        y={254}
        fontSize="10"
        fontFamily="monospace"
        fill={colors.textTertiary}
        textAnchor="middle"
      >
        sequential writes
      </text>
    </svg>
  );
}

function PipelineSlide({ shouldReduceMotion }: SlideProps) {
  const slotW = 108;
  const slotGap = 10;
  const startX = 118;
  const slotX = (i: number) => startX + i * (slotW + slotGap);
  const consensusH = 96;
  const executionH = 56;
  const consensusY = 52;
  const executionY = 218;

  const consensusBlocks = [
    {
      col: 0,
      rows: ["N proposed", "N−1 voted", "N−2 finalized"],
    },
    {
      col: 1,
      rows: ["N+1 proposed", "N voted", "N−1 finalized"],
    },
    {
      col: 2,
      rows: ["N+2 proposed", "N+1 voted", "N finalized"],
    },
    {
      col: 3,
      rows: ["N+3 proposed", "N+2 voted", "N+1 finalized"],
    },
  ];
  const executionBlocks = [
    { col: 0, label: "N−2 executed" },
    { col: 1, label: "N−1 executed" },
    { col: 2, label: "N executed" },
    { col: 3, label: "N+1 executed" },
  ];

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.38, ease: HERO_EASE };

  return (
    <svg
      role="img"
      aria-label="Top consensus track shows each slot's proposed, voted, and finalized blocks. Bottom execution track shows the finalized block being executed in that slot."
      viewBox={`0 0 ${SLIDE_W} ${SLIDE_H}`}
      className="w-full h-full"
    >
      <defs>
        <marker
          id="pipeline-finalized-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill={colors.textTertiary} />
        </marker>
      </defs>
      <text
        x={28}
        y={consensusY + consensusH / 2 + 5}
        fontSize="14"
        fontFamily="monospace"
        fill={colors.userAccent}
      >
        consensus
      </text>
      <text
        x={28}
        y={executionY + executionH / 2 + 5}
        fontSize="14"
        fontFamily="monospace"
        fill={colors.solutionAccent}
      >
        execution
      </text>

      {consensusBlocks.map((b, i) => (
        <motion.g
          key={`c-${b.col}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : i * 0.08 }}
        >
          <rect
            x={slotX(b.col)}
            y={consensusY}
            width={slotW}
            height={consensusH}
            rx={10}
            fill={colors.userBg}
            stroke={colors.userAccent}
            strokeWidth="1.5"
          />
          {b.rows.map((row, rowIndex) => (
            <text
              key={row}
              x={slotX(b.col) + slotW / 2}
              y={consensusY + 28 + rowIndex * 24}
              fontSize="11"
              fontFamily="monospace"
              textAnchor="middle"
              fill={colors.userAccent}
            >
              {row}
            </text>
          ))}
        </motion.g>
      ))}

      {consensusBlocks.map((b, i) => (
        <motion.line
          key={`arrow-${b.col}`}
          x1={slotX(b.col) + slotW / 2}
          x2={slotX(b.col) + slotW / 2}
          y1={consensusY + consensusH + 8}
          y2={executionY - 10}
          stroke={colors.textTertiary}
          strokeWidth="1"
          strokeDasharray="3 4"
          markerEnd="url(#pipeline-finalized-arrow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.65 }}
          transition={{ ...transition, delay: shouldReduceMotion ? 0 : i * 0.08 + 0.45 }}
        />
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
            height={executionH}
            rx={10}
            fill={colors.solutionBg}
            stroke={colors.solutionAccent}
            strokeWidth="1.5"
          />
          <text
            x={slotX(b.col) + slotW / 2}
            y={executionY + executionH / 2 + 5}
            fontSize="11"
            fontFamily="monospace"
            textAnchor="middle"
            fill={colors.solutionAccent}
          >
            {b.label}
          </text>
        </motion.g>
      ))}

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

const DiagramHoverContext = createContext<{
  activeId: string | null;
  setActive: (id: string | null) => void;
  hints: Record<string, LayerMapHint>;
}>({ activeId: null, setActive: () => {}, hints: {} });

function useDiagramHover() {
  return useContext(DiagramHoverContext);
}

const ENGINE_HINTS: Record<string, LayerMapHint> = {
  interleaved: {
    title: "Ethereum-style interleave",
    body: "Shown for contrast. On Ethereum-style chains, leader execution, proposal, validator re-execution, and voting share one ~12 s slot. Real CPU time is the thin red slivers (~100 ms). Monad's pipeline below skips this trade-off.",
  },
  consensus: {
    title: "Consensus pipeline",
    body: "Every ~400 ms the next leader proposes a block (N, N+1, N+2…) and validators vote. Consensus can keep advancing without waiting for execution of the current block.",
  },
  execution: {
    title: "Execution pipeline",
    body: "Execution runs a block once it finalizes, two slots after proposal, while consensus keeps ordering newer blocks. Each block gets the full ~400 ms of CPU instead of a sliced budget.",
  },
  verify: {
    title: "Delayed verification",
    body: "State-root verification lands after the D=3 delayed Merkle root. Some apps can act on finalized blocks; higher-assurance workflows may wait for Verified.",
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
          <p className="font-mono text-[10px] font-medium text-solution-accent tracking-wide uppercase mb-1.5">
            {hint.title}
          </p>
          <p className="text-sm text-text-primary leading-relaxed">
            {hint.body}
          </p>
        </>
      ) : (
        <p className="text-xs text-text-tertiary font-normal leading-relaxed">
          {defaultText}
        </p>
      )}
    </aside>
  );
}

function StepControls({
  label,
  step,
  maxStep,
  paused,
  onPrev,
  onNext,
  onTogglePause,
}: {
  label: string;
  step: number;
  maxStep: number;
  paused?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePause?: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1">
      <button
        type="button"
        aria-label={`Previous ${label} step`}
        onClick={onPrev}
        disabled={step === 0}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border font-mono text-xs text-text-secondary transition-colors hover:border-solution-accent hover:text-solution-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        {"<-"}
      </button>
      <button
        type="button"
        aria-label={`Next ${label} step`}
        onClick={onNext}
        disabled={step === maxStep}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border font-mono text-xs text-text-secondary transition-colors hover:border-solution-accent hover:text-solution-accent disabled:cursor-not-allowed disabled:opacity-30"
      >
        {"->"}
      </button>
      {onTogglePause && (
        <button
          type="button"
          aria-label={paused ? `Play ${label}` : `Pause ${label}`}
          onClick={onTogglePause}
          className="flex h-7 min-w-14 items-center justify-center rounded-md border border-border px-2 font-mono text-[10px] text-text-secondary transition-colors hover:border-solution-accent hover:text-solution-accent"
        >
          {paused ? "play" : "pause"}
        </button>
      )}
      <span className="ml-1 font-mono text-[10px] tabular-nums text-text-tertiary">
        {step + 1}/{maxStep + 1}
      </span>
    </div>
  );
}

const ENGINE_CAPTIONS = [
  "Traditional interleaving squeezes execution into the slot before the next proposal.",
  "Monad consensus keeps accepting and ordering blocks on its own lane.",
  "Execution runs after order is fixed, with the full block time available locally.",
  "State roots are verified after a three-block delay, catching divergence quickly.",
];

const ENGINE_MAX_STEP = ENGINE_CAPTIONS.length - 1;
const ENGINE_CYCLE_MS = 9000;

function EngineDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode, setStepper } = usePresenter();
  const { ref, isVisible } = useInView(0.18);

  return (
    <div
      ref={ref}
      className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6"
    >
      {/* Remounting on mode change resets the presenter reveal sequence. */}
      <EngineDeck
        key={presenterMode ? "present" : "auto"}
        presenterMode={presenterMode}
        isVisible={isVisible}
        shouldReduceMotion={shouldReduceMotion}
        setStepper={setStepper}
      />
    </div>
  );
}

function EngineDeck({
  presenterMode,
  isVisible,
  shouldReduceMotion,
  setStepper,
}: {
  presenterMode: boolean;
  isVisible: boolean;
  shouldReduceMotion: boolean;
  setStepper: (stepper: Stepper | null) => void;
}) {
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(presenterMode ? 0 : ENGINE_MAX_STEP);
  const stepRef = useRef(presenterMode ? 0 : ENGINE_MAX_STEP);
  const [activeId, setActiveId] = useState<string | null>(null);
  const paused = activeId !== null;

  const setStepBoth = useCallback((next: number) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (stepRef.current < ENGINE_MAX_STEP) {
      setStepBoth(stepRef.current + 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  const goPrev = useCallback(() => {
    if (stepRef.current > 0) {
      setStepBoth(stepRef.current - 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  useEffect(() => {
    if (!presenterMode || !isVisible) return;
    setStepper({ next: goNext, prev: goPrev });
    return () => setStepper(null);
  }, [presenterMode, isVisible, goNext, goPrev, setStepper]);

  useEffect(() => {
    if (presenterMode || !isVisible || shouldReduceMotion || paused) return;
    const id = setInterval(() => setCycle((c) => c + 1), ENGINE_CYCLE_MS);
    return () => clearInterval(id);
  }, [presenterMode, isVisible, shouldReduceMotion, paused]);

  const slots = [0, 1, 2, 3];
  const consensusBlocks = ["N−1", "N", "N+1", "N+2"];
  const emptyBlocks: (string | null)[] = [null, null, null, null];
  // a block executes in the slot it finalizes, two slots after proposal
  const executionBlocks = [null, null, "N−1", "N"] as const;
  const verifyBlocks = [null, null, null, "N−3"] as const;
  const renderStep = presenterMode ? step : ENGINE_MAX_STEP;
  const showConsensus = renderStep >= 1;
  const showExecution = renderStep >= 2;
  const showVerify = renderStep >= 3;

  return (
    <DiagramHoverContext.Provider
      value={{ activeId, setActive: setActiveId, hints: ENGINE_HINTS }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px] gap-3 lg:gap-5 items-start">
        <div
          className="min-w-0"
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
                values={showConsensus ? consensusBlocks : emptyBlocks}
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
                values={showExecution ? [...executionBlocks] : emptyBlocks}
                cycle={cycle}
                shouldReduceMotion={shouldReduceMotion}
                delayBase={0.7}
                highlightSlot={3}
              />
            </HoverExplain>
            <HoverExplain id="verify" className="px-1.5 py-1">
              <PipelineRow
                label="verify"
                tone="dark"
                slots={slots}
                values={showVerify ? [...verifyBlocks] : emptyBlocks}
                cycle={cycle}
                shouldReduceMotion={shouldReduceMotion}
                delayBase={1.4}
                trailingNote={showVerify ? "3-block delay · ~1.2 s" : undefined}
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

          <div className="mt-4 flex min-h-[40px] flex-col items-start gap-3 sm:flex-row">
            {presenterMode && (
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous step"
                  onClick={goPrev}
                  disabled={renderStep === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border font-mono text-xs text-text-secondary transition-colors hover:border-solution-accent hover:text-solution-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {"<-"}
                </button>
                <button
                  type="button"
                  aria-label="Next step"
                  onClick={goNext}
                  disabled={renderStep === ENGINE_MAX_STEP}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border font-mono text-xs text-text-secondary transition-colors hover:border-solution-accent hover:text-solution-accent disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {"->"}
                </button>
                <span className="ml-1 font-mono text-[10px] tabular-nums text-text-tertiary">
                  {renderStep + 1}/{ENGINE_MAX_STEP + 1}
                </span>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.p
                key={renderStep}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: -4 }
                }
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className={`text-text-secondary font-normal leading-relaxed ${
                  presenterMode ? "text-base" : "text-sm"
                }`}
              >
                {ENGINE_CAPTIONS[renderStep]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="space-y-3">
          <DiagramExplainer />
        </div>
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
    { label: "exec", w: 2, color: colors.problemAccentStrong },
    { label: "propose", w: 40, color: colors.userBg },
    { label: "exec", w: 2, color: colors.problemAccentStrong },
    { label: "vote", w: 56, color: colors.problemCell },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-3">
      <div className="mb-2.5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span
          className="font-mono text-xs leading-tight"
          style={{ color: colors.problemAccentStrong }}
        >
          <span className="text-[10px] text-text-tertiary">traditional</span>{" "}
          <span>interleaved</span>
        </span>
        <span className="font-mono text-[10px] text-text-tertiary">
          exec ≈ 1% of the 12 s slot (~100 ms)
        </span>
      </div>
      <div className="space-y-1">
        <div
          className="relative h-10 rounded-lg overflow-hidden border flex"
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
              className="h-full flex items-center justify-center px-2"
              style={{ backgroundColor: seg.color }}
            >
              <span
                className="font-mono text-[10px] whitespace-nowrap"
                style={{ color: colors.textPrimary }}
              >
                {seg.w >= 18 ? seg.label : ""}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <span
            className="inline-block h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: colors.problemAccentStrong }}
          />
          <span className="font-mono text-[9px] text-text-tertiary">
            exec slivers drawn at 2% for visibility
          </span>
        </div>
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

const PARALLEL_EXAMPLE_TXS = [
  {
    id: "tx 1",
    action: "Alice -> Bob: 5 USDC",
    inputs: ["Alice: 100", "Bob: 100"],
    outputs: ["Alice: 95", "Bob: 105"],
    commitStep: 2,
  },
  {
    id: "tx 2",
    action: "unrelated tx",
    inputs: ["slot X"],
    outputs: ["slot X*"],
    commitStep: 3,
  },
  {
    id: "tx 3",
    action: "Bob -> Charlie: 10 USDC",
    inputs: ["Bob: 100", "Charlie: 100"],
    outputs: ["Bob: 90", "Charlie: 110"],
    rerunInputs: ["Bob: 105", "Charlie: 100"],
    rerunOutputs: ["Bob: 95", "Charlie: 110"],
    conflictStep: 4,
    commitStep: 5,
  },
  {
    id: "tx 4",
    action: "unrelated tx",
    inputs: ["slot Y"],
    outputs: ["slot Y*"],
    commitStep: 6,
  },
];

function ParallelPendingResultExample({
  step,
  reduced,
}: {
  step: number;
  reduced: boolean;
}) {
  const committed = [
    {
      label: "Alice",
      value: step >= 2 ? "95" : "100",
      changed: step === 2,
    },
    {
      label: "Bob",
      value: step >= 5 ? "95" : step >= 2 ? "105" : "100",
      changed: step === 2 || step === 5,
    },
    {
      label: "Charlie",
      value: step >= 5 ? "110" : "100",
      changed: step === 5,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-[145px_minmax(0,1fr)_145px] gap-3">
        <div className="rounded-lg border border-border bg-surface-elevated p-3 lg:min-h-[244px]">
          <p className="font-mono text-[10px] font-medium text-text-tertiary">
            before block N
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs text-text-primary">
            <p>Alice: 100 USDC</p>
            <p>Bob: 100 USDC</p>
            <p>Charlie: 100 USDC</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface-elevated">
          <div className="grid grid-cols-[42px_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border px-3 py-2 font-mono text-[10px] text-text-tertiary">
            <span>order</span>
            <span>tx</span>
            <span>inputs</span>
            <span>outputs</span>
          </div>
          <div className="divide-y divide-border">
            {PARALLEL_EXAMPLE_TXS.map((tx) => {
              const conflict =
                "conflictStep" in tx && step >= (tx.conflictStep ?? 99);
              const rerun =
                "rerunOutputs" in tx && step >= tx.commitStep;
              const pendingVisible = step >= 1;
              const committedVisible = step >= tx.commitStep;
              const commitChanged = step === tx.commitStep;
              const conflictChanged =
                "conflictStep" in tx && step === (tx.conflictStep ?? -1);
              const rerunChanged =
                "rerunOutputs" in tx && step === tx.commitStep;
              const dependencyFocus =
                step === 0 && (tx.id === "tx 1" || tx.id === "tx 3");
              const unrelatedFocus = step === 0 && tx.id === "tx 2";
              const pendingResultFocus = step === 1;
              const rowProblemFocus = dependencyFocus || (conflictChanged && !rerun);
              const rowSolutionFocus =
                unrelatedFocus || commitChanged || rerunChanged || step === 6;
              const rowFocusColor = rowProblemFocus
                ? colors.problemBg
                : rowSolutionFocus
                  ? colors.solutionBg
                  : "transparent";
              const inputFocusColor =
                conflictChanged && !rerun
                  ? colors.problemBg
                  : rerunChanged || pendingResultFocus || unrelatedFocus
                    ? colors.solutionBg
                    : dependencyFocus || (conflict && !rerun)
                      ? colors.problemBg
                      : "transparent";
              const outputFocusColor =
                conflictChanged && !rerun
                  ? colors.problemBg
                  : rerunChanged || commitChanged || pendingResultFocus
                    ? colors.solutionBg
                    : conflict && !rerun
                      ? colors.problemBg
                      : "transparent";
              const inputs = rerun && tx.rerunInputs ? tx.rerunInputs : tx.inputs;
              const outputs =
                rerun && tx.rerunOutputs ? tx.rerunOutputs : tx.outputs;
              return (
                <motion.div
                  key={tx.id}
                  initial={false}
                  animate={{
                    backgroundColor:
                      rowFocusColor !== "transparent" && !reduced
                        ? ["transparent", rowFocusColor, "transparent", rowFocusColor]
                        : rowFocusColor,
                  }}
                  transition={{ duration: reduced ? 0 : 0.7 }}
                  className="grid min-h-[86px] grid-cols-[42px_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 overflow-hidden px-3 py-2 sm:h-[86px]"
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      initial={false}
                      animate={{
                        backgroundColor:
                          commitChanged && !reduced
                            ? [
                                colors.surface,
                                colors.solutionBg,
                                colors.surface,
                                colors.solutionBg,
                              ]
                            : committedVisible
                              ? colors.solutionBg
                              : colors.surface,
                      }}
                      transition={{ duration: reduced ? 0 : 0.7 }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[10px]"
                      style={{
                        borderColor: committedVisible
                          ? colors.solutionAccent
                          : colors.border,
                        color: committedVisible
                          ? colors.solutionAccent
                          : colors.textTertiary,
                      }}
                    >
                      {tx.id.replace("tx ", "")}
                    </motion.span>
                  </div>
                  <p className="min-h-[44px] text-sm leading-relaxed text-text-primary">
                    {tx.action}
                  </p>
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: pendingVisible ? 1 : 0.25,
                      backgroundColor:
                        inputFocusColor !== "transparent" && !reduced
                          ? [
                              "transparent",
                              inputFocusColor,
                              "transparent",
                              inputFocusColor,
                            ]
                          : inputFocusColor,
                    }}
                    transition={{ duration: reduced ? 0 : 0.7 }}
                    className="min-h-[54px] rounded-md px-2 py-1 font-mono text-[10px] leading-relaxed text-text-secondary"
                  >
                    {inputs.map((input) => (
                      <p key={input}>{input}</p>
                    ))}
                    <p
                      className="mt-1 min-h-[14px] overflow-hidden text-ellipsis whitespace-nowrap text-[9px] leading-[14px]"
                      style={{
                        color:
                          conflict && !rerun
                            ? colors.problemAccentStrong
                            : "transparent",
                        overflow: "hidden",
                        textOverflow: "clip",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conflict && !rerun ? "now 105" : "reserved"}
                    </p>
                  </motion.div>
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: pendingVisible ? 1 : 0.25,
                      backgroundColor:
                        outputFocusColor !== "transparent" && !reduced
                          ? [
                              "transparent",
                              outputFocusColor,
                              "transparent",
                              outputFocusColor,
                            ]
                          : outputFocusColor,
                    }}
                    transition={{ duration: reduced ? 0 : 0.7 }}
                    className="min-h-[62px] rounded-md px-2 py-1 font-mono text-[10px] leading-relaxed text-text-secondary"
                  >
                    {outputs.map((output) => (
                      <p key={output}>{output}</p>
                    ))}
                    <p
                      className="mt-1 min-h-[14px] overflow-hidden text-ellipsis whitespace-nowrap text-[9px] leading-[14px]"
                      style={{
                        color:
                          conflict && !rerun
                            ? colors.problemAccentStrong
                            : rerun && tx.rerunOutputs
                              ? colors.solutionAccent
                              : "transparent",
                        overflow: "hidden",
                        textOverflow: "clip",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {conflict && !rerun
                        ? "stale"
                        : rerun && tx.rerunOutputs
                          ? "ok"
                          : "reserved"}
                    </p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-elevated p-3 lg:min-h-[244px]">
          <p className="font-mono text-[10px] font-medium text-text-tertiary">
            committed state
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs text-text-primary">
            {committed.map((line) => (
              <motion.p
                key={line.label}
                initial={false}
                animate={{
                  opacity: 1,
                  backgroundColor:
                    (line.changed || step === 6) && !reduced
                      ? [
                          "transparent",
                          colors.solutionBg,
                          "transparent",
                          colors.solutionBg,
                        ]
                      : "transparent",
                }}
                transition={{ duration: reduced ? 0 : 0.7 }}
                className="-mx-1 min-h-[20px] rounded px-1 leading-5"
              >
                {line.label}: {line.value} USDC
              </motion.p>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] leading-relaxed text-text-tertiary">
            {"commit order: 1 -> 2 -> 3 -> 4"}
          </p>
        </div>
      </div>
    </div>
  );
}

const PARALLEL_CAPTIONS = [
  "Block N has a fixed order. tx 1 and tx 3 both touch Bob's USDC balance; tx 2 is unrelated.",
  "Executors produce pending results in parallel, recording each transaction's inputs and outputs.",
  "Commit is serial. tx 1 commits first, changing Bob from 100 to 105.",
  "tx 2 is unrelated, so it commits cleanly before the stale Bob-dependent result is checked.",
  "tx 3 expected Bob to be 100, but committed state now has Bob at 105. That pending result is stale.",
  "tx 3 re-executes with cached inputs, then commits with the corrected Bob balance.",
  "The final committed state matches serial EVM execution, even though computation ran in parallel.",
];

const PARALLEL_MAX_STEP = PARALLEL_CAPTIONS.length - 1;
const PARALLEL_STEP_MS = 2300;

function ParallelExecutionDiagram() {
  const shouldReduceMotion = !!useReducedMotion();
  const { presenterMode, setStepper } = usePresenter();
  const { ref, isVisible } = useInView(0.18);

  return (
    <div
      ref={ref}
      className="bg-surface-elevated border border-border rounded-2xl p-5 sm:p-6 space-y-5"
    >
      {/* Remounting on mode change resets the step cleanly (no setState-in-effect). */}
      <ParallelDeck
        key={presenterMode ? "present" : "auto"}
        presenterMode={presenterMode}
        isVisible={isVisible}
        shouldReduceMotion={shouldReduceMotion}
        setStepper={setStepper}
      />
    </div>
  );
}

function ParallelDeck({
  presenterMode,
  isVisible,
  shouldReduceMotion,
  setStepper,
}: {
  presenterMode: boolean;
  isVisible: boolean;
  shouldReduceMotion: boolean;
  setStepper: (stepper: Stepper | null) => void;
}) {
  // Reduced motion outside presenter jumps straight to the finished state.
  const initialStep =
    shouldReduceMotion && !presenterMode ? PARALLEL_MAX_STEP : 0;
  const [step, setStep] = useState(initialStep);
  const [paused, setPaused] = useState(false);
  const stepRef = useRef(initialStep);

  const setStepBoth = useCallback((next: number) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const goNext = useCallback(() => {
    if (stepRef.current < PARALLEL_MAX_STEP) {
      setStepBoth(stepRef.current + 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  const goPrev = useCallback(() => {
    if (stepRef.current > 0) {
      setStepBoth(stepRef.current - 1);
      return true;
    }
    return false;
  }, [setStepBoth]);

  // Presenter mode: register as the active stepper for this slide.
  useEffect(() => {
    if (!presenterMode || !isVisible) return;
    setStepper({ next: goNext, prev: goPrev });
    return () => setStepper(null);
  }, [presenterMode, isVisible, goNext, goPrev, setStepper]);

  // Auto-play (slow) when scrolled into view and not presenting.
  useEffect(() => {
    if (presenterMode || shouldReduceMotion || !isVisible || paused) return;
    const id = setInterval(() => {
      // one extra tick past the last step holds the finished state before looping
      setStepBoth((stepRef.current + 1) % (PARALLEL_MAX_STEP + 2));
    }, PARALLEL_STEP_MS);
    return () => clearInterval(id);
  }, [presenterMode, shouldReduceMotion, isVisible, paused, setStepBoth]);

  const renderStep = Math.min(step, PARALLEL_MAX_STEP);

  const facts = [
    "Optimistic: every executor starts immediately instead of waiting for earlier transactions.",
    "At commit time a result's inputs must still match state; stale results re-execute.",
    "Re-runs are cheap because inputs are mostly cached, and block order never changes.",
  ];

  return (
    <>
      <div className="rounded-xl bg-surface border border-border p-4">
        <ParallelPendingResultExample
          step={renderStep}
          reduced={shouldReduceMotion}
        />

        <div className="mt-4 flex h-[112px] flex-col items-start gap-3 overflow-hidden sm:h-16 sm:flex-row">
          <StepControls
            label="parallel execution"
            step={renderStep}
            maxStep={PARALLEL_MAX_STEP}
            paused={paused}
            onPrev={goPrev}
            onNext={goNext}
            onTogglePause={() => setPaused((p) => !p)}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={renderStep}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: -4 }
              }
              transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
              className={`text-text-secondary font-normal leading-relaxed ${
                presenterMode ? "text-base" : "text-sm"
              } sm:min-h-[40px]`}
            >
              {PARALLEL_CAPTIONS[renderStep]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {facts.map((fact, index) => (
          <div
            key={fact}
            className="rounded-lg border border-border bg-surface px-3 py-2"
          >
            <p className="font-mono text-[10px] font-medium text-solution-accent mb-1 tabular-nums">
              0{index + 1}
            </p>
            <p
              className={`text-text-secondary leading-relaxed ${
                presenterMode ? "text-base" : "text-sm"
              }`}
            >
              {fact}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
