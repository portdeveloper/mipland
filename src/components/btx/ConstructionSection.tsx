"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { colors } from "@/lib/colors";
import { useInView } from "../useInView";
import { usePrefersReducedMotion } from "./useReducedMotion";
import Hint from "./Hint";

const COMMITTEE_N = 5;
const BATCH = 5;

export default function ConstructionSection() {
  const { ref, isVisible } = useInView(0.1);
  return (
    <section
      ref={ref}
      className="py-24 px-6 bg-surface-elevated border-y border-border"
    >
      <div
        className={`max-w-[1120px] mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.015em]">
          The construction, at a glance
        </h2>
        <p className="text-[1.075rem] text-text-secondary font-light leading-[1.6] max-w-[46rem] mb-8">
          BTX builds on pairing-friendly elliptic curves (BLS12-381). What
          follows is a sketch of how users encrypt, how the committee opens a
          batch, and the trick that keeps opening a big batch cheap. The
          paper has the full protocol, proofs, and security reductions.
        </p>

        {/* 1. Encryption */}
        <CiphertextFormula />

        {/* 2. Committee */}
        <div className="mb-10">
          <h3 className="text-[1.15rem] font-semibold mb-2">
            One G₁ element per server, regardless of batch size
          </h3>
          <p className="text-[14px] text-text-secondary leading-[1.6] max-w-[46rem] mb-6">
            Powers of the secret key τ are{" "}
            <Hint term="Shamir shares">Shamir-shared</Hint> across N servers,
            one piece each. Any t+1 of them together decrypt a batch. Each
            server sends exactly <strong>one group element</strong> to the
            combiner, so its message size stays independent of batch size.
          </p>
          <CommitteeAnimation />
        </div>

        {/* 3. FFT trick */}
        <div
          className="rounded-2xl border p-[22px]"
          style={{
            background: colors.solutionBg,
            borderColor:
              "color-mix(in oklab, " +
              colors.solutionAccent +
              " 22%, transparent)",
          }}
        >
          <h3 className="text-[1.15rem] font-semibold mb-2">
            How BTX reaches O(B log B) inside the scheme
          </h3>
          <p className="text-[14px] text-text-secondary leading-[1.6] mb-3.5 max-w-[46rem]">
            Written the obvious way, BTX&apos;s decryption costs{" "}
            <span className="font-mono">O(B²)</span>{" "}
            <Hint term="pairing">pairings</Hint>: every ciphertext contributes
            a cross-term to every other. BTX observes that those cross-terms
            form a <em>contiguous window of a polynomial product</em>,
            computable as a middle-product via{" "}
            <Hint term="FFT">FFT</Hint>. That brings it down to{" "}
            <span className="font-mono">O(B log B)</span> group operations
            and <span className="font-mono">O(B)</span> pairings. Same
            scheme, same output, just the internal arithmetic.
          </p>
          <FftComparison />
        </div>
      </div>
    </section>
  );
}

/* ---------- 1. Ciphertext formula ---------- */
function CiphertextFormula() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 md:[grid-template-columns:minmax(0,0.85fr)_minmax(0,1.15fr)] gap-7 mb-10 items-center">
      <div>
        <h3 className="text-[1.15rem] font-semibold mb-2">
          An ElGamal-shaped ciphertext
        </h3>
        <p className="text-[14px] text-text-secondary leading-[1.6]">
          A user encrypts their transaction m by picking a random value r.
          The ciphertext is a pair: the randomness in G₁, and the message
          masked by a pad derived from r and the public encryption key in
          G_T. That pair sits in the mempool until the committee opens it.
        </p>
      </div>
      <div
        ref={ref}
        className="bg-surface border border-border rounded-2xl p-[22px]"
        style={{ fontFamily: "var(--font-plex-mono), ui-monospace, monospace" }}
      >
        <div className="flex items-center gap-2.5 flex-wrap text-[14px]">
          <span style={{ color: colors.textSecondary }}>ct =</span>
          <span
            className="font-semibold px-3 py-2 rounded-lg"
            style={{
              background: colors.userAccentLight,
              color: colors.userAccent,
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.5s, transform 0.5s",
            }}
          >
            [r]₁
          </span>
          <span style={{ color: colors.textTertiary }}>,</span>
          <span
            className="font-semibold px-3 py-2 rounded-lg"
            style={{
              background: colors.solutionAccentLight,
              color: colors.solutionAccent,
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.5s 0.25s, transform 0.5s 0.25s",
            }}
          >
            m + r · ek
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-[18px] pt-4 border-t border-border">
          <div>
            <p
              className="text-[11px] font-semibold mb-0.5"
              style={{ color: colors.userAccent }}
            >
              [r]₁
            </p>
            <p className="text-[10.5px] text-text-tertiary leading-[1.45]">
              randomness in G₁
            </p>
          </div>
          <div>
            <p
              className="text-[11px] font-semibold mb-0.5"
              style={{ color: colors.solutionAccent }}
            >
              m + r · ek
            </p>
            <p className="text-[10.5px] text-text-tertiary leading-[1.45]">
              masked message in G_T
            </p>
          </div>
        </div>
        <p className="text-[10.5px] text-text-tertiary mt-3.5 leading-[1.5]">
          Core size: |G₁| + |G_T|. A short Schnorr NIZK rides alongside for
          CCA security.
        </p>
      </div>
    </div>
  );
}

/* ---------- 2. Committee SVG animation ---------- */
interface FlyingDot {
  id: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  start: number;
  duration: number;
}

function CommitteeAnimation() {
  const reduced = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [ctVisible, setCtVisible] = useState<boolean[]>(() =>
    reduced ? new Array(BATCH).fill(true) : new Array(BATCH).fill(false),
  );
  const [serverOn, setServerOn] = useState<boolean[]>(() =>
    reduced
      ? new Array(COMMITTEE_N).fill(true)
      : new Array(COMMITTEE_N).fill(false),
  );
  const [ptVisible, setPtVisible] = useState<boolean[]>(() =>
    reduced ? new Array(BATCH).fill(true) : new Array(BATCH).fill(false),
  );
  const [dots, setDots] = useState<FlyingDot[]>([]);
  const playingRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextDotId = useRef(0);

  const cx = 320;
  const cy = 140;
  const rad = 60;

  const cts = useMemo(
    () =>
      Array.from({ length: BATCH }).map((_, i) => ({
        y: 50 + i * 38,
        x: 140,
      })),
    [],
  );
  const pts = useMemo(
    () =>
      Array.from({ length: BATCH }).map((_, i) => ({
        y: 50 + i * 38,
        x: 500,
      })),
    [],
  );
  const servers = useMemo(
    () =>
      Array.from({ length: COMMITTEE_N }).map((_, i) => {
        const angle = (i / COMMITTEE_N) * Math.PI * 2 - Math.PI / 2;
        return {
          sx: cx + Math.cos(angle) * rad,
          sy: cy + Math.sin(angle) * rad,
        };
      }),
    [],
  );

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const addDot = useCallback(
    (x0: number, y0: number, x1: number, y1: number, duration: number) => {
      const id = nextDotId.current++;
      setDots((prev) => [
        ...prev,
        { id, x0, y0, x1, y1, start: performance.now(), duration },
      ]);
      const t = setTimeout(
        () => setDots((prev) => prev.filter((d) => d.id !== id)),
        duration + 60,
      );
      timersRef.current.push(t);
    },
    [],
  );

  const resetState = useCallback(() => {
    setCtVisible(new Array(BATCH).fill(false));
    setServerOn(new Array(COMMITTEE_N).fill(false));
    setPtVisible(new Array(BATCH).fill(false));
    setDots([]);
  }, []);

  const play = useCallback(() => {
    if (playingRef.current) return;
    playingRef.current = true;
    clearTimers();
    resetState();

    const speed = 1;
    const schedule = (ms: number, fn: () => void) => {
      const t = setTimeout(fn, ms / speed);
      timersRef.current.push(t);
    };

    let t0 = 0;
    for (let i = 0; i < BATCH; i++) {
      const idx = i;
      schedule(t0, () => {
        setCtVisible((arr) => {
          const next = arr.slice();
          next[idx] = true;
          return next;
        });
      });
      t0 += 80;
    }
    t0 += 200;

    schedule(t0, () => {
      cts.forEach((c) => {
        addDot(c.x, c.y, cx, cy, 500);
      });
    });
    t0 += 600;

    for (let i = 0; i < COMMITTEE_N; i++) {
      const idx = i;
      const s = servers[i];
      schedule(t0, () => {
        setServerOn((arr) => {
          const next = arr.slice();
          next[idx] = true;
          return next;
        });
        addDot(s.sx, s.sy, cx, cy, 400);
      });
      t0 += 120;
    }
    t0 += 300;

    for (let i = 0; i < BATCH; i++) {
      const idx = i;
      const p = pts[i];
      schedule(t0, () => {
        addDot(cx, cy, p.x, p.y, 400);
        const t = setTimeout(() => {
          setPtVisible((arr) => {
            const next = arr.slice();
            next[idx] = true;
            return next;
          });
        }, 400);
        timersRef.current.push(t);
      });
      t0 += 100;
    }
    t0 += 1200;

    const done = setTimeout(() => {
      playingRef.current = false;
    }, t0);
    timersRef.current.push(done);
  }, [addDot, cts, pts, resetState, servers]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    if (reduced) {
      // The initializers above ran during hydration, when the media query
      // isn't known yet (reduced=false) — force the final frame here.
      clearTimers();
      playingRef.current = false;
      setTimeout(() => {
        setCtVisible(new Array(BATCH).fill(true));
        setServerOn(new Array(COMMITTEE_N).fill(true));
        setPtVisible(new Array(BATCH).fill(true));
        setDots([]);
      }, 0);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimers();
    };
  }, [play, reduced]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-[22px]">
      <svg
        ref={svgRef}
        viewBox="0 0 640 280"
        className="w-full block"
        aria-hidden="true"
      >
        {(["CIPHERTEXTS", "COMMITTEE", "PLAINTEXTS"] as const).map((l, i) => (
          <text
            key={l}
            x={[90, 320, 550][i]}
            y={18}
            textAnchor="middle"
            fontFamily="var(--font-plex-mono), ui-monospace, monospace"
            fontSize={9}
            fill={colors.textTertiary}
            letterSpacing={0.8}
          >
            {l}
          </text>
        ))}

        {cts.map((c, i) => (
          <g
            key={i}
            opacity={ctVisible[i] ? 1 : 0}
            style={{ transition: "opacity 0.4s" }}
          >
            <rect
              x={40}
              y={c.y - 12}
              width={100}
              height={24}
              rx={4}
              fill={colors.surfaceElevated}
              stroke={colors.border}
            />
            <text
              x={60}
              y={c.y + 3}
              fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              fontSize={11}
              fill={colors.solutionAccent}
              fontWeight={600}
            >
              ct
            </text>
            <text
              x={78}
              y={c.y + 3}
              fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              fontSize={10}
              fill={colors.textTertiary}
            >
              #{i + 1}
            </text>
          </g>
        ))}

        <circle
          cx={cx}
          cy={cy}
          r={rad + 10}
          fill="none"
          stroke={colors.border}
          strokeDasharray="3 3"
        />
        <text
          x={cx}
          y={cy - rad - 18}
          textAnchor="middle"
          fontFamily="var(--font-plex-mono), ui-monospace, monospace"
          fontSize={9}
          fill={colors.textTertiary}
        >
          t+1 of N
        </text>
        <text
          x={cx}
          y={cy + rad + 24}
          textAnchor="middle"
          fontFamily="var(--font-plex-mono), ui-monospace, monospace"
          fontSize={9}
          fill={colors.textTertiary}
        >
          combiner · 1 G₁ per server
        </text>
        {servers.map((s, i) => (
          <g key={i}>
            <circle
              cx={s.sx}
              cy={s.sy}
              r={9}
              fill={serverOn[i] ? colors.solutionAccent : colors.solutionAccentLight}
              stroke={colors.solutionAccent}
              strokeWidth={1.2}
              style={{ transition: "fill 0.3s" }}
            />
            <text
              x={s.sx}
              y={s.sy + 3}
              textAnchor="middle"
              fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              fontSize={8}
              fill={serverOn[i] ? "white" : colors.solutionAccent}
              fontWeight={600}
            >
              σ{i + 1}
            </text>
          </g>
        ))}

        {pts.map((p, i) => (
          <g
            key={i}
            opacity={ptVisible[i] ? 1 : 0}
            style={{ transition: "opacity 0.4s" }}
          >
            <rect
              x={500}
              y={p.y - 12}
              width={100}
              height={24}
              rx={4}
              fill={colors.solutionAccentLight}
              stroke={colors.solutionAccent}
              strokeWidth={0.8}
            />
            <text
              x={515}
              y={p.y + 3}
              fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              fontSize={11}
              fill={colors.solutionAccent}
              fontWeight={600}
            >
              m
            </text>
            <text
              x={527}
              y={p.y + 6}
              fontFamily="var(--font-plex-mono), ui-monospace, monospace"
              fontSize={9}
              fill={colors.solutionAccent}
            >
              {i + 1}
            </text>
          </g>
        ))}

        {dots.map((d) => (
          <FlyingDotEl key={d.id} dot={d} />
        ))}
      </svg>
      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={play}
          className="bg-transparent border border-border rounded-full font-mono text-[11px] px-3.5 py-1.5 text-text-secondary hover:border-text-tertiary transition-colors"
        >
          ↻ replay
        </button>
      </div>
    </div>
  );
}

function FlyingDotEl({ dot }: { dot: FlyingDot }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - dot.start) / dot.duration);
      setT(progress);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [dot.start, dot.duration]);
  const eased = 1 - Math.pow(1 - t, 3);
  const cx = dot.x0 + (dot.x1 - dot.x0) * eased;
  const cy = dot.y0 + (dot.y1 - dot.y0) * eased;
  return (
    <circle cx={cx} cy={cy} r={3} fill={colors.solutionAccent} opacity={1 - eased} />
  );
}

/* ---------- 3. FFT grid comparison (animated) ---------- */
function FftComparison() {
  const reduced = usePrefersReducedMotion();
  const naiveRefs = useRef<(HTMLDivElement | null)[]>([]);
  const btxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const btxActiveOrder = useMemo(() => {
    const cells: number[] = [];
    for (let k = 6; k <= 8; k++) {
      for (let row = 0; row < 8; row++) {
        const col = k - row;
        if (col >= 0 && col < 8) cells.push(row * 8 + col);
      }
    }
    return cells;
  }, []);

  const [naiveCount, setNaiveCount] = useState(reduced ? 64 : 0);
  const [btxCount, setBtxCount] = useState(
    reduced ? btxActiveOrder.length : 0,
  );

  useEffect(() => {
    if (reduced) {
      naiveRefs.current.forEach((el) => {
        if (el) {
          el.style.background = colors.problemAccent;
          el.style.opacity = "0.95";
        }
      });
      btxActiveOrder.forEach((idx) => {
        const el = btxRefs.current[idx];
        if (el) {
          el.style.background = colors.solutionAccent;
          el.style.opacity = "0.95";
        }
      });
      setTimeout(() => {
        setNaiveCount(64);
        setBtxCount(btxActiveOrder.length);
      }, 0);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let rafId = 0;

    const resetAll = () => {
      naiveRefs.current.forEach((c) => {
        if (!c) return;
        c.style.background = colors.problemAccentLight;
        c.style.opacity = "0.35";
        c.style.transform = "";
      });
      btxRefs.current.forEach((c) => {
        if (!c) return;
        c.style.background = colors.solutionAccentLight;
        c.style.opacity = "0.3";
        c.style.transform = "";
      });
      setNaiveCount(0);
      setBtxCount(0);
    };

    const runLoop = () => {
      let step = 0;
      const tick = () => {
        if (stopped) return;
        if (step > 70) {
          resetAll();
          step = 0;
          timer = setTimeout(tick, 800);
          return;
        }
        if (step < 64) {
          const n = naiveRefs.current[step];
          if (n) {
            n.style.background = colors.problemAccent;
            n.style.opacity = "0.95";
            n.style.transform = "scale(1.15)";
            const reset = setTimeout(() => {
              if (!stopped && n) n.style.transform = "";
            }, 150);
            timer = reset;
          }
          setNaiveCount(step + 1);
        }
        if (step < btxActiveOrder.length) {
          const idx = btxActiveOrder[step];
          const b = btxRefs.current[idx];
          if (b) {
            b.style.background = colors.solutionAccent;
            b.style.opacity = "0.95";
            b.style.transform = "scale(1.15)";
            setTimeout(() => {
              if (!stopped && b) b.style.transform = "";
            }, 150);
          }
          setBtxCount(step + 1);
        }
        step++;
        timer = setTimeout(tick, 55);
      };
      tick();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          rafId = requestAnimationFrame(runLoop);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      io.disconnect();
    };
  }, [btxActiveOrder, reduced]);

  return (
    <div ref={containerRef} className="mt-5">
      <div className="grid [grid-template-columns:1fr_auto_1fr] gap-[18px] items-center">
        <div>
          <p
            className="font-mono text-[10.5px] font-semibold mb-2 text-center"
            style={{ color: colors.problemAccentStrong }}
          >
            Without FFT: O(B²)
          </p>
          <div
            className="grid grid-cols-8 gap-[2px] max-w-[160px] mx-auto"
            style={{ aspectRatio: "1 / 1" }}
          >
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  naiveRefs.current[i] = el;
                }}
                style={{
                  background: colors.problemAccentLight,
                  aspectRatio: "1 / 1",
                  borderRadius: 1,
                  opacity: 0.35,
                  transition:
                    "opacity 0.25s, background 0.25s, transform 0.2s",
                }}
              />
            ))}
          </div>
        </div>
        <div
          className="font-mono text-[22px]"
          style={{ color: colors.textTertiary }}
        >
          →
        </div>
        <div>
          <p className="font-mono text-[10.5px] font-semibold mb-2 text-center text-solution-accent">
            With FFT: O(B log B)
          </p>
          <div
            className="grid grid-cols-8 gap-[2px] max-w-[160px] mx-auto"
            style={{ aspectRatio: "1 / 1" }}
          >
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                ref={(el) => {
                  btxRefs.current[i] = el;
                }}
                style={{
                  background: colors.solutionAccentLight,
                  aspectRatio: "1 / 1",
                  borderRadius: 1,
                  opacity: 0.3,
                  transition:
                    "opacity 0.25s, background 0.25s, transform 0.2s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div
        className="flex justify-between max-w-[400px] mx-auto mt-3.5 font-mono text-[11px]"
      >
        <span style={{ color: colors.problemAccentStrong }}>
          Without FFT:{" "}
          <span className="font-semibold tabular-nums">{naiveCount}</span> / 64
        </span>
        <span className="text-solution-accent">
          With FFT:{" "}
          <span className="font-semibold tabular-nums">{btxCount}</span> / ~
          {btxActiveOrder.length}
        </span>
      </div>
    </div>
  );
}
