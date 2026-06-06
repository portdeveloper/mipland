"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

/* ─── Mini-visualization: MIP-8 page-aligned grid ────────────────────── */
function MiniGrid() {
  const cols = 16;
  const rows = 4;
  const total = cols * rows;
  const [activeSlot, setActiveSlot] = useState(-1);
  const [pageHighlight, setPageHighlight] = useState(false);

  const cycleRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let cancelled = false;

    const runCycle = () => {
      if (cancelled) return;
      // Pick a random slot in the second row (page 1)
      const slot = cols + Math.floor(Math.random() * cols);
      setActiveSlot(slot);
      setPageHighlight(false);

      cycleRef.current = setTimeout(() => {
        if (cancelled) return;
        setPageHighlight(true);

        cycleRef.current = setTimeout(() => {
          if (cancelled) return;
          setActiveSlot(-1);
          setPageHighlight(false);

          cycleRef.current = setTimeout(runCycle, 800);
        }, 2000);
      }, 600);
    };

    const initial = setTimeout(runCycle, 500);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearTimeout(cycleRef.current);
    };
  }, []);

  const pageRow = Math.floor(activeSlot / cols);

  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => {
        const row = Math.floor(i / cols);
        const isActive = i === activeSlot;
        const isPageLit = pageHighlight && row === pageRow;

        let bg = "#e2ddd7";
        if (isActive) bg = "#c4653a";
        else if (isPageLit) bg = "#2a7d6a";

        return (
          <motion.div
            key={i}
            animate={{ backgroundColor: bg }}
            transition={{ duration: 0.2, delay: isPageLit ? (i % cols) * 0.02 : 0 }}
            className="aspect-square rounded-[2px]"
          />
        );
      })}
    </div>
  );
}

/* ─── Mini-visualization: MIP-3 cost bars ────────────────────────────── */
function MiniCostBars() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let frame: ReturnType<typeof setTimeout>;

    const run = () => {
      let p = 0;
      const tick = () => {
        if (cancelled) return;
        p += 0.025;
        if (p > 1) {
          setProgress(1);
          frame = setTimeout(() => {
            setProgress(0);
            frame = setTimeout(run, 600);
          }, 2000);
          return;
        }
        setProgress(p);
        frame = setTimeout(tick, 50);
      };
      tick();
    };

    frame = setTimeout(run, 800);
    return () => {
      cancelled = true;
      clearTimeout(frame);
    };
  }, []);

  // Quadratic grows as p², linear grows as p
  const quadratic = Math.min(100, progress * progress * 100);
  const linear = Math.min(100, progress * 25); // caps at 25% for visual contrast

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-problem-muted w-10 shrink-0">
          EVM
        </span>
        <div className="flex-1 h-2 bg-problem-cell/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-problem-accent rounded-full"
            animate={{ width: `${Math.max(2, quadratic)}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[9px] text-solution-muted w-10 shrink-0">
          MIP-3
        </span>
        <div className="flex-1 h-2 bg-solution-cell/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-solution-accent rounded-full"
            animate={{ width: `${Math.max(2, linear)}%` }}
            transition={{ duration: 0.05 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Mini-visualization: MIP-7 opcode grid ──────────────────────────── */
const DEFINED_BYTES = new Set<number>([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
  0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
  0x20,
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f,
  0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
  0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e,
  0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f,
  0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f,
  0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,
  0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
  0xa0, 0xa1, 0xa2, 0xa3, 0xa4,
  0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xfa, 0xfd, 0xfe, 0xff,
]);

function MiniOpcodeGrid() {
  return (
    <div
      className="grid gap-[1.5px] w-full"
      style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
    >
      {Array.from({ length: 256 }, (_, i) => {
        const isExtension = i === 0xae;
        const isDefined = DEFINED_BYTES.has(i);
        return (
          <motion.div
            key={i}
            animate={
              isExtension
                ? { backgroundColor: ["#2a7d6a", "#1a5c4e", "#2a7d6a"] }
                : {}
            }
            transition={
              isExtension
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
            className="aspect-square rounded-[1px]"
            style={{
              backgroundColor: isExtension
                ? "#2a7d6a"
                : isDefined
                ? "#9b9084"
                : "#e2ddd7",
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Mini-visualization: MIP-4 balance bar ──────────────────────────── */
const BALANCE_STEPS = [
  { balance: 25, color: "#2a7d6a" },
  { balance: 18, color: "#2a7d6a" },
  { balance: 8, color: "#c4653a" },
  { balance: 8, color: "#c4653a" },
  { balance: 18, color: "#2a7d6a" },
  { balance: 18, color: "#2a7d6a" },
];

function MiniBalanceBar() {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (cancelled) return;
      const next = (stepRef.current + 1) % BALANCE_STEPS.length;
      stepRef.current = next;
      setStep(next);
      const delay = next === 0 ? 2500 : 1200;
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const current = BALANCE_STEPS[step];
  const pct = (current.balance / 30) * 100;
  const reservePct = (10 / 30) * 100;

  return (
    <div className="flex items-end gap-3 h-16">
      <div className="flex-1 h-full bg-border/30 rounded relative overflow-hidden">
        {/* Reserve line */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-problem-accent/60 z-10"
          style={{ bottom: `${reservePct}%` }}
        />
        {/* Fill */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 rounded-b"
          animate={{
            height: `${pct}%`,
            backgroundColor: current.color,
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="w-14 shrink-0 pb-0.5">
        <motion.p
          key={step}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          className="font-mono text-lg font-semibold tabular-nums leading-none"
          style={{ color: current.color }}
        >
          {current.balance}
        </motion.p>
        <p className="font-mono text-[9px] text-text-tertiary mt-0.5">MON</p>
      </div>
    </div>
  );
}

/* ─── Mini-visualization: MIP-12 vote pace ───────────────────────────── */
function MiniVotePace() {
  return (
    <div className="flex items-center justify-center gap-3 h-16">
      <span className="font-mono text-2xl font-light tabular-nums text-problem-accent/60 line-through decoration-problem-accent/30">
        400
      </span>
      <svg
        className="w-5 h-5 text-text-tertiary shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 12h14m0 0l-6-6m6 6l-6 6"
        />
      </svg>
      <motion.span
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="font-mono text-4xl font-semibold tabular-nums text-solution-accent"
      >
        300
      </motion.span>
      <span className="font-mono text-[10px] text-text-tertiary self-end pb-1.5">
        ms
      </span>
    </div>
  );
}

/* ─── Card component ─────────────────────────────────────────────────── */

interface MipCardProps {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  description: string;
  exploreLabel: string;
  beta?: boolean;
  visualization: React.ReactNode;
  index: number;
}

function MipCard({
  id,
  href,
  title,
  subtitle,
  description,
  exploreLabel,
  beta,
  visualization,
  index,
}: MipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: 0.4 + index * 0.12,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      <Link
        href={href}
        aria-label={`${exploreLabel} ${id}: ${title}`}
        className="group flex flex-col bg-surface-elevated rounded-2xl border border-border hover:border-text-tertiary/40 transition-all duration-300 hover:shadow-md overflow-hidden h-full"
      >
        {/* Visualization area */}
        <div className="px-6 pt-6 pb-4">{visualization}</div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[11px] text-text-tertiary tracking-wider">
              {id}
            </span>
            {beta && (
              <span className="font-mono text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded-full">
                beta
              </span>
            )}
          </div>
          <h2 className="text-lg font-semibold mb-1 transition-colors duration-300 group-hover:text-solution-accent">
            {title}
          </h2>
          <p className="font-mono text-[11px] text-text-tertiary mb-2">
            {subtitle}
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {description}
          </p>
          <span className="inline-flex items-center gap-1 mt-4 font-mono text-xs text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
            {exploreLabel}
            <svg
              className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Mini-visualization: Spam MEV block grid ──────────────────────── */
function MiniSpamGrid() {
  const cols = 9;
  const rows = 4;
  const total = cols * rows;
  const [cells, setCells] = useState<number[]>([]);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const generate = () => {
      const c: number[] = [];
      const successIdx = Math.floor(Math.random() * total);
      for (let i = 0; i < total; i++) {
        if (i === successIdx) { c.push(3); continue; } // success
        const r = Math.random();
        c.push(r < 0.3 ? 0 : r < 0.78 ? 1 : 2); // user, spam-idle, spam-fail
      }
      if (!cancelled) {
        setCells(c);
        setCycle((n) => n + 1);
      }
    };
    generate();
    const timer = setInterval(generate, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // 0=user, 1=spam-idle, 2=spam-fail, 3=spam-success
  const colors = ["#d4e4f4", "#f0d0c0", "#e8b8a8", "#c8e6d8"];

  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {cells.map((type, i) => (
        <motion.div
          key={`${cycle}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backgroundColor: colors[type] }}
          transition={{ duration: 0.2, delay: i * 0.015 }}
          className="aspect-square rounded-[2px]"
        />
      ))}
    </div>
  );
}

/* ─── Mini-visualization: BTE encrypted mempool ──────────────────────── */
function MiniBteGrid() {
  const cols = 9;
  const rows = 4;
  const total = cols * rows;
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"encrypt" | "decrypt">("encrypt");

  useEffect(() => {
    let cancelled = false;
    const t: ReturnType<typeof setTimeout>[] = [];

    const run = () => {
      if (cancelled) return;
      const s = new Set<number>();
      const target = Math.floor(total * 0.4);
      while (s.size < target) s.add(Math.floor(Math.random() * total));
      setSelected(s);
      setPhase("encrypt");
      t.push(setTimeout(() => !cancelled && setPhase("decrypt"), 1500));
      t.push(setTimeout(() => !cancelled && run(), 3800));
    };
    run();
    return () => {
      cancelled = true;
      t.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      className="grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => {
        const isSelected = selected.has(i);
        const decrypted = phase === "decrypt" && isSelected;
        return (
          <motion.div
            key={i}
            animate={{
              backgroundColor: decrypted ? "#c8e6df" : "#e2ddd7",
            }}
            transition={{ duration: 0.3, delay: decrypted ? (i * 0.01) : 0 }}
            className="aspect-square rounded-[2px]"
          />
        );
      })}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────── */

export default function HomeContent() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen flex flex-col items-center px-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl w-full text-center mt-28 sm:mt-36 mb-2"
      >
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.05] tracking-tight mb-5">
          {t("home.title")}
        </h1>
        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-lg mx-auto leading-relaxed">
          {t("home.subtitle")}{" "}
          <br className="hidden sm:block" />
          {t("home.subtitleBreak")}
        </p>
      </motion.div>

      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-4xl mb-5 mt-10"
      >
        <p className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase">
          {t("home.proposals")}
        </p>
      </motion.div>

      {/* Bento grid: MIP-8 featured, MIP-3 + MIP-4 side-by-side */}
      <div className="w-full max-w-4xl mb-28">
        {/* Featured: MIP-8 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.35,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mb-4"
        >
          <Link
            href="/mip-8"
            aria-label={`${t("home.explore")} MIP-8: ${t("home.mip8.title")}`}
            className="group block bg-surface-elevated rounded-2xl border border-border hover:border-text-tertiary/40 transition-all duration-300 hover:shadow-md overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Visualization */}
              <div className="p-8 flex flex-col justify-center">
                <div className="w-full max-w-[340px]">
                  <MiniGrid />
                </div>
                <p className="font-mono text-[10px] text-text-tertiary mt-3">
                  {t("home.mip8.miniNote")}
                </p>
              </div>
              {/* Content */}
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[11px] text-text-tertiary tracking-wider">
                    MIP-8
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2 group-hover:text-solution-accent transition-colors duration-300">
                  {t("home.mip8.title")}
                </h2>
                <p className="font-mono text-[11px] text-text-tertiary mb-3">
                  {t("home.mip8.subtitle")}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t("home.mip8.description")}
                </p>
                <span className="inline-flex items-center gap-1 mt-5 font-mono text-xs text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                  {t("home.explore")}
                  <svg
                    className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Proposals: MIP-3 + MIP-4 + MIP-7 + MIP-12 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MipCard
            id="MIP-3"
            href="/mip-3"
            title={t("home.mip3.title")}
            subtitle={t("home.mip3.subtitle")}
            description={t("home.mip3.description")}
            exploreLabel={t("home.explore")}
            beta
            visualization={<MiniCostBars />}
            index={0}
          />
          <MipCard
            id="MIP-4"
            href="/mip-4"
            title={t("home.mip4.title")}
            subtitle={t("home.mip4.subtitle")}
            description={t("home.mip4.description")}
            exploreLabel={t("home.explore")}
            beta
            visualization={<MiniBalanceBar />}
            index={1}
          />
          <MipCard
            id="MIP-7"
            href="/mip-7"
            title={t("home.mip7.title")}
            subtitle={t("home.mip7.subtitle")}
            description={t("home.mip7.description")}
            exploreLabel={t("home.explore")}
            beta
            visualization={<MiniOpcodeGrid />}
            index={2}
          />
          <MipCard
            id="MIP-12"
            href="/mip-12"
            title={t("home.mip12.title")}
            subtitle={t("home.mip12.subtitle")}
            description={t("home.mip12.description")}
            exploreLabel={t("home.explore")}
            beta
            visualization={<MiniVotePace />}
            index={3}
          />
        </div>
      </div>

      {/* Research section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="w-full max-w-4xl mb-5 mt-2"
      >
        <p className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase">
          Research
        </p>
      </motion.div>

      <div className="w-full max-w-4xl mb-28 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.95,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Link
            href="/spam-mev"
            aria-label="Explore Spam MEV: Blockspace Under Pressure"
            className="group block bg-surface-elevated rounded-2xl border border-border hover:border-text-tertiary/40 transition-all duration-300 hover:shadow-md overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-8 flex flex-col justify-center">
                <MiniSpamGrid />
                <p className="font-mono text-[10px] text-text-tertiary mt-3">
                  Spam probes fill the block, but rarely find a trade
                </p>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[11px] text-text-tertiary tracking-wider">
                    Category Labs
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2 group-hover:text-problem-accent transition-colors duration-300">
                  Spam MEV
                </h2>
                <p className="font-mono text-[11px] text-text-tertiary mb-3">
                  Blockspace under pressure
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Explore how block capacity, gas price floors, and transaction
                  ordering jointly determine spam volumes. Play with the
                  equilibrium model from the paper.
                </p>
                <span className="inline-flex items-center gap-1 mt-5 font-mono text-xs text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                  Explore
                  <svg
                    className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 1.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <Link
            href="/btx"
            aria-label="Explore BTX: Batched Threshold Encryption"
            className="group block bg-surface-elevated rounded-2xl border border-border hover:border-text-tertiary/40 transition-all duration-300 hover:shadow-md overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="p-8 flex flex-col justify-center">
                <MiniBteGrid />
                <p className="font-mono text-[10px] text-text-tertiary mt-3">
                  Committee opens only the batch; the rest stays encrypted
                </p>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[11px] text-text-tertiary tracking-wider">
                    Category Labs
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-2 group-hover:text-solution-accent transition-colors duration-300">
                  BTX
                </h2>
                <p className="font-mono text-[11px] text-text-tertiary mb-3">
                  Batched threshold encryption, finally practical
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  A new scheme for encrypted mempools. Shortest ciphertext of
                  any BTE, collision-free, epochless, and fast enough to keep
                  up with real block times.
                </p>
                <span className="inline-flex items-center gap-1 mt-5 font-mono text-xs text-text-tertiary group-hover:text-text-secondary transition-colors duration-300">
                  Explore
                  <svg
                    className="w-3.5 h-3.5 translate-x-0 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
