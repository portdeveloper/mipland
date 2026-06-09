"use client";

import {
  AnimatePresence,
  motion,
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
      <img
        src={src}
        alt={label}
        width={size}
        height={size}
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
              Inside that execution lane, transactions can run optimistically in
              parallel, then commit in the original block order so smart
              contracts see serial EVM semantics<Cite n={5} />.
            </p>
          </>
        }
      >
        <EngineDiagram />
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

function EvmCompatibilityDiagram() {
  const { presenterMode } = usePresenter();
  const familiar = [
    "Solidity",
    "EVM bytecode",
    "20-byte addresses",
    "typed transactions",
    "wallets",
    "JSON-RPC",
    "Foundry",
    "Hardhat",
  ];
  const networkFacts = [
    { label: "Chain ID", value: "143" },
    { label: "Currency", value: "MON" },
    { label: "RPC", value: "https://rpc.monad.xyz" },
    { label: "Explorer", value: "monadscan.com" },
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
    "Each chunk range gets a two-hop broadcast tree.",
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
  "Execution updates a slot. Every node on the path changes.",
  "Copy on write: a new branch appears, the old version stays.",
  "New nodes append to SSD in order. Nothing is overwritten.",
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
  const showReader = !shouldReduceMotion && beat === 0;
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

function SameDifferentDiagram() {
  const sameItems: ReactNode[] = [
    <>Solidity contracts and EVM bytecode stay familiar<Cite n={1} /></>,
    <>Wallets, accounts, signatures, and addresses look like Ethereum<Cite n={1} /></>,
    <>Standard JSON-RPC remains the main app interface<Cite n={[1, 15]} /></>,
    <>Foundry and Hardhat workflows use Monad network settings<Cite n={16} /></>,
  ];
  const differentItems: ReactNode[] = [
    <>Treat block states as confidence levels: Proposed, Voted, Finalized, Verified<Cite n={6} /></>,
    <>Transactions are charged by gas limit, not gas used<Cite n={7} /></>,
    <><span className="font-mono">latest</span> reads can include proposed state; pick tags deliberately<Cite n={15} /></>,
    <>There is no global mempool; RPC nodes forward to upcoming leaders<Cite n={8} /></>,
    <>Reserve balance rules matter for edge cases like delegated EOAs<Cite n={10} /></>,
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
    body: "MonadBFT, RaptorCast, asynchronous execution, and MonadDB in full detail.",
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
              <img
                src={qr.src}
                alt={`QR code to ${qr.label}`}
                width={260}
                height={260}
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
    <section className="bg-surface-alt border-t border-border px-6 py-24">
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
            async execution, and MonadDB.
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
    { id: "V2", label: "validator 2", x: 300, y: 88, range: "c0-c2" },
    { id: "V5", label: "validator 5", x: 300, y: 180, range: "c3-c5" },
    { id: "V7", label: "validator 7", x: 300, y: 272, range: "c6-c8" },
  ];
  const secondHopGroups = [
    {
      parent: firstHopNodes[0],
      recipients: [
        { id: "V1", label: "validator 1", x: 512, y: 70 },
        { id: "V3", label: "validator 3", x: 540, y: 132 },
      ],
    },
    {
      parent: firstHopNodes[1],
      recipients: [
        { id: "V4", label: "validator 4", x: 530, y: 162 },
        { id: "V6", label: "validator 6", x: 530, y: 214 },
      ],
    },
    {
      parent: firstHopNodes[2],
      recipients: [
        { id: "V8", label: "validator 8", x: 540, y: 262 },
        { id: "V9", label: "validator 9", x: 512, y: 326 },
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
          <text
            x={recipient.x + 24}
            y={recipient.y + 1}
            fontSize="8.5"
            fontFamily="monospace"
            fill={colors.textTertiary}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {recipient.label}
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
            {node.label}
          </text>
          <text
            x={node.x}
            y={node.y + 45}
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
              <p className="mt-4 text-xs text-text-tertiary font-normal leading-relaxed">
                Transactions run in parallel; state conflicts re-execute. The
                block&apos;s recorded order is still 1 → 2 → 3 → 4.
              </p>
            </div>
          </HoverExplain>
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
    { label: "exec", w: 12, color: colors.problemAccentLight },
    { label: "propose", w: 24, color: colors.userBg },
    { label: "exec", w: 12, color: colors.problemAccentLight },
    { label: "vote", w: 28, color: colors.problemCell },
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
          ~100 ms exec budget per block
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
