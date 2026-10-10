"use client";

import { useEffect, useState } from "react";
import { colors } from "@/lib/colors";
import { useInView } from "../useInView";
import { usePrefersReducedMotion } from "./useReducedMotion";
import Hint from "./Hint";

type SchemeKind =
  | "allornothing"
  | "crs"
  | "collision-slow"
  | "mixed-epoch"
  | "collision-fast"
  | "expensive";

interface Scheme {
  id: string;
  name: string;
  kind: SchemeKind;
}

// Order and names match the Comparison table exactly.
const SCHEMES: Scheme[] = [
  { id: "ibe", name: "Batched IBE", kind: "allornothing" },
  { id: "trx", name: "Fernando et al. (TrX)", kind: "crs" },
  { id: "beat", name: "BEAT-MEV", kind: "collision-slow" },
  { id: "gong", name: "Gong et al.", kind: "mixed-epoch" },
  { id: "beatpp", name: "BEAT++ (Agarwal)", kind: "collision-fast" },
  { id: "pfe", name: "PFE (Boneh et al.)", kind: "expensive" },
];

export default function EncryptedMempoolSection() {
  const { ref, isVisible } = useInView(0.1);
  const [activeId, setActiveId] = useState(SCHEMES[0].id);
  const active = SCHEMES.find((s) => s.id === activeId) ?? SCHEMES[0];

  return (
    <section
      ref={ref}
      className="py-24 px-6 scroll-mt-16"
    >
      <div
        className={`max-w-[1120px] mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="mb-4 text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.015em]">
          Why encrypted mempools are hard to build
        </h2>
        <p className="text-[1.075rem] text-text-secondary font-light leading-[1.6] max-w-[46rem] mb-8">
          Every prior batched threshold encryption scheme gives up at least
          one of the four properties a real{" "}
          <Hint term="encrypted mempool">encrypted mempool</Hint> needs: no
          dropped transactions, no recurring setup, small ciphertexts, and
          fast opens. Pick a scheme to see what breaks.
        </p>

        <div className="grid gap-6 md:[grid-template-columns:minmax(260px,340px)_1fr]">
          <div className="flex flex-col gap-1.5">
            {SCHEMES.map((s) => {
              const isActive = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`text-left border rounded-[10px] px-3.5 py-3 transition-all duration-150 ${
                    isActive
                      ? "border-solution-accent bg-solution-bg"
                      : "border-border bg-surface-elevated hover:border-text-tertiary"
                  }`}
                  style={
                    isActive
                      ? {
                          boxShadow:
                            "0 0 0 3px color-mix(in oklab, " +
                            colors.solutionAccent +
                            " 12%, transparent)",
                        }
                      : undefined
                  }
                  aria-pressed={isActive}
                >
                  <span className="text-[13.5px] font-medium text-text-primary">
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="bg-surface-elevated border border-border rounded-2xl p-[22px] min-h-[400px] relative overflow-hidden">
            <SchemeCanvas scheme={active} />
          </div>
        </div>

        <div
          className="mt-6 rounded-2xl border px-[22px] py-5 flex gap-3.5 items-start"
          style={{
            background: colors.solutionBg,
            borderColor:
              "color-mix(in oklab, " + colors.solutionAccent + " 22%, transparent)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-white shrink-0"
            style={{ backgroundColor: colors.solutionAccent }}
            aria-hidden="true"
          >
            ✓
          </div>
          <p className="text-text-primary leading-[1.55]">
            <strong className="text-solution-accent">BTX fills the gap:</strong>{" "}
            the first BTE scheme that is{" "}
            <strong>
              <Hint term="collision-free">collision-free</Hint>,{" "}
              <Hint term="epochless">epochless</Hint>, compact
            </strong>{" "}
            (<Hint term="ciphertext">ciphertext</Hint> as small as plain{" "}
            <Hint term="ElGamal">ElGamal</Hint>), and{" "}
            <strong>fast</strong> (decryption scales with the actual batch,
            not the maximum supported).
          </p>
        </div>
      </div>
    </section>
  );
}

function SchemeCanvas({ scheme }: { scheme: Scheme }) {
  return (
    <>
      <p className="text-[17px] font-semibold m-0 mb-4">{scheme.name}</p>
      {scheme.kind === "allornothing" && <AllOrNothingViz />}
      {scheme.kind === "crs" && <CrsViz />}
      {scheme.kind === "collision-slow" && (
        <CollisionViz
          copy={
            <>
              Users have to pick an index to encrypt under. Two users can
              collide; an attacker can deliberately land on Alice&apos;s
              index to censor her. Decryption also runs in{" "}
              <span className="font-mono">O(B²)</span>, quadratic in batch
              size.
            </>
          }
          showBigO
        />
      )}
      {scheme.kind === "mixed-epoch" && <MixedEpochViz />}
      {scheme.kind === "collision-fast" && (
        <CollisionViz
          copy={
            <>
              Faster than BEAT-MEV (decryption is <span className="font-mono">O(Bmax log Bmax)</span>),
              but index collisions still exist. A user can still be censored
              by an attacker picking their index.
            </>
          }
        />
      )}
      {scheme.kind === "expensive" && <ExpensiveViz />}
    </>
  );
}

/* ---------- Batched IBE: all-or-nothing via epoch ---------- */
const IBE_SELECTED = new Set([2, 5, 9, 13, 18, 22, 26, 31, 35, 39, 42, 46]);

function AllOrNothingViz() {
  const [released, setReleased] = useState(false);
  return (
    <div>
      <p className="text-text-secondary text-[14px] leading-[1.55] mb-4">
        Releasing the epoch key decrypts <em>every</em>{" "}
        pending transaction in the window, including the ones the builder
        left out. Transactions that didn&apos;t make it in still leak, so
        they can&apos;t safely roll over. Setup runs every epoch.
      </p>
      <div className="flex gap-1.5 p-3 bg-surface rounded-lg flex-wrap">
        {Array.from({ length: 48 }).map((_, i) => {
          const bg = released
            ? colors.solutionAccentLight
            : IBE_SELECTED.has(i)
              ? colors.problemAccentLight
              : colors.border;
          return (
            <div
              key={i}
              className="w-4 h-4 rounded-[2px]"
              style={{
                backgroundColor: bg,
                transition: `background 0.3s ${released ? (i * 15) / 1000 : 0}s`,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={() => setReleased(true)}
          className="font-mono text-[11px] px-3.5 py-2 rounded-lg text-white"
          style={{ backgroundColor: colors.problemAccent }}
        >
          Release epoch key
        </button>
      </div>
      {released && (
        <p
          className="font-mono text-[11px] mt-2.5 text-center"
          style={{ color: colors.problemAccentStrong }}
        >
          ✗ all 48 revealed — privacy gone
        </p>
      )}
    </div>
  );
}

/* ---------- TrX: CRS grows forever ---------- */
function CrsViz() {
  const reduced = usePrefersReducedMotion();
  const [b, setB] = useState(1);
  useEffect(() => {
    if (reduced) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (stopped) return;
      setB((prev) => {
        const next = prev + Math.ceil(Math.random() * 50);
        if (next / 20 >= 100) return 1;
        return next;
      });
      timer = setTimeout(tick, 120);
    };
    timer = setTimeout(tick, 120);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [reduced]);
  const pct = Math.min(100, b / 20);
  return (
    <div>
      <p className="text-text-secondary text-[14px] leading-[1.55] mb-4">
        TrX has no epoch, but its Common Reference String grows with the
        number of decryption sessions. On a long-lived chain, it grows
        without bound.
      </p>
      <div className="p-5 bg-surface rounded-[10px]">
        <div className="h-3 bg-border rounded-md overflow-hidden mb-2">
          <div
            className="h-full"
            style={{
              background: colors.problemAccent,
              width: pct + "%",
              transition: "width 0.3s",
            }}
          />
        </div>
        <div className="flex justify-between font-mono text-[11px] text-text-secondary">
          <span>Block {b.toLocaleString()}</span>
          <span>
            <Hint term="CRS">CRS</Hint> size:{" "}
            <span
              className="font-semibold"
              style={{ color: colors.problemAccentStrong }}
            >
              {(32 + b * 0.04).toFixed(1)} KB
            </span>
          </span>
        </div>
      </div>
      <p
        className="font-mono text-[11px] mt-3.5 text-center"
        style={{ color: colors.problemAccentStrong }}
      >
        ✗ setup scales with history
      </p>
    </div>
  );
}

/* ---------- BEAT-MEV / BEAT++: indexed, collision-prone ---------- */
function CollisionViz({
  copy,
  showBigO,
}: {
  copy: React.ReactNode;
  showBigO?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      setT((prev) => (prev + 1) % 240);
      timer = setTimeout(() => {
        raf = requestAnimationFrame(step);
      }, 50);
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [reduced]);

  const effectiveT = reduced ? 140 : t;
  const alicePos = Math.min(100, effectiveT * 1.2);
  const attackPos = Math.min(100, (effectiveT + 40) * 1.2);
  const aliceFaded = effectiveT > 80 && effectiveT < 120;
  const attackerLanded = effectiveT > 100;
  const collided = effectiveT > 120;

  return (
    <div>
      <p className="text-text-secondary text-[14px] leading-[1.55] mb-4">
        {copy}
      </p>
      <div className="grid [grid-template-columns:auto_1fr_auto] gap-x-3 gap-y-2 items-center font-mono text-[12px]">
        <span
          className="font-semibold px-2 py-0.5 rounded-full text-[11px]"
          style={{ color: colors.userAccent, background: colors.userBg }}
        >
          Alice
        </span>
        <div className="relative h-7 bg-surface rounded-md overflow-hidden">
          <div
            className="absolute top-1/2 px-2 py-0.5 rounded"
            style={{
              left: alicePos + "%",
              transform: "translate(-50%, -50%)",
              background: colors.userAccentLight,
              color: colors.userAccent,
              fontSize: 10,
              opacity: aliceFaded ? 0.2 : 1,
              transition: "opacity 0.3s",
            }}
          >
            ct_A
          </div>
        </div>
        <span className="text-text-tertiary text-[10px]">idx 7</span>

        <span
          className="font-semibold px-2 py-0.5 rounded-full text-[11px]"
          style={{
            color: colors.problemAccent,
            background: colors.problemBg,
          }}
        >
          Attacker
        </span>
        <div className="relative h-7 bg-surface rounded-md overflow-hidden">
          <div
            className="absolute top-1/2 px-2 py-0.5 rounded"
            style={{
              left: attackPos + "%",
              transform: "translate(-50%, -50%)",
              background: attackerLanded
                ? colors.problemAccent
                : colors.problemAccentLight,
              color: attackerLanded ? "white" : colors.problemAccent,
              fontSize: 10,
            }}
          >
            ct_X {attackerLanded ? "✓" : ""}
          </div>
        </div>
        <span className="text-text-tertiary text-[10px]">idx 7</span>
      </div>

      <div
        className="mt-4 px-3.5 py-2.5 rounded-lg border transition-all"
        style={{
          background: collided ? colors.problemBg : colors.surface,
          borderColor: collided ? colors.problemAccentLight : colors.border,
        }}
      >
        <p
          className="font-mono text-[11px] m-0"
          style={{
            color: collided ? colors.problemAccentStrong : colors.textTertiary,
          }}
        >
          {collided
            ? "✗ Collision on idx 7 — Alice censored"
            : "… both users send to same slot"}
        </p>
      </div>

      {showBigO && (
        <p
          className="font-mono text-[10.5px] mt-3 text-center"
          style={{ color: colors.problemAccentStrong }}
        >
          decryption cost: O(B²) — quadratic in batch size
        </p>
      )}
    </div>
  );
}

/* ---------- Gong et al.: mixed collision behavior + epoch ---------- */
function MixedEpochViz() {
  const [released, setReleased] = useState(false);
  return (
    <div>
      <p className="text-text-secondary text-[14px] leading-[1.55] mb-4">
        Collision-free only when users coordinate; without coordination,
        collisions return. Ciphertexts are also tied to the current epoch,
        so a missed transaction can&apos;t roll over. It expires.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <div
          className="rounded-lg border p-3.5"
          style={{
            background: colors.problemBg,
            borderColor: colors.problemAccentLight,
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold mb-1.5"
            style={{ color: colors.problemAccentStrong }}
          >
            Uncoordinated users
          </p>
          <p className="font-mono text-[10.5px] leading-[1.5]" style={{ color: colors.textSecondary }}>
            same idx → collision returns
          </p>
        </div>
        <div
          className="rounded-lg border p-3.5"
          style={{
            background: colors.problemBg,
            borderColor: colors.problemAccentLight,
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.08em] font-semibold mb-1.5"
            style={{ color: colors.problemAccentStrong }}
          >
            Epoch N expires
          </p>
          <p className="font-mono text-[10.5px] leading-[1.5]" style={{ color: colors.textSecondary }}>
            un-included ct drops
          </p>
        </div>
      </div>
      <div className="flex justify-center mt-3">
        <button
          type="button"
          onClick={() => setReleased(true)}
          className="font-mono text-[11px] px-3.5 py-2 rounded-lg text-white"
          style={{ backgroundColor: colors.problemAccent }}
        >
          Advance one epoch
        </button>
      </div>
      {released && (
        <p
          className="font-mono text-[11px] mt-2.5 text-center"
          style={{ color: colors.problemAccentStrong }}
        >
          ✗ pending ciphertexts invalidated
        </p>
      )}
    </div>
  );
}

/* ---------- PFE: expensive compute + 2 G₁ ciphertext ---------- */
function ExpensiveViz() {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (stopped) return;
      setStep((prev) => (prev + 1) % 6);
      timer = setTimeout(tick, 700);
    };
    timer = setTimeout(tick, 700);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [reduced]);

  const effectiveStep = reduced ? 5 : step;
  const pfePairing =
    effectiveStep >= 1 && effectiveStep <= 4 ? effectiveStep : null;
  const pfeSegHighlight = (n: string) =>
    pfePairing !== null && n.split(" ").includes(String(pfePairing));
  const btxActive = effectiveStep === 1;

  return (
    <div>
      <p className="text-text-secondary text-[14px] leading-[1.55] mb-4">
        PFE is collision-free and epochless, but its ciphertext carries
        2 G₁ elements (vs BTX&apos;s 1) and decryption runs 4{" "}
        <Hint term="pairing">pairings</Hint> per open. Concretely heavier in
        both size and speed.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div
          className="p-3.5 rounded-[10px] border"
          style={{
            background: colors.problemBg,
            borderColor: colors.problemAccentLight,
          }}
        >
          <p
            className="font-mono text-[10.5px] tracking-[0.08em] uppercase font-semibold mb-2.5"
            style={{ color: colors.problemAccentStrong }}
          >
            PFE open
          </p>
          <div className="flex gap-1 mb-2.5">
            <Seg
              color={colors.problemAccentLight}
              fg={colors.problemAccentStrong}
              label="G₁"
              flex={1}
              highlight={pfeSegHighlight("1") ? colors.problemAccent : undefined}
            />
            <Seg
              color={colors.problemAccentLight}
              fg={colors.problemAccentStrong}
              label="G₁"
              flex={1}
              highlight={pfeSegHighlight("2") ? colors.problemAccent : undefined}
            />
            <Seg
              color={colors.problemAccent}
              fg="white"
              label="G_T"
              flex={2}
              highlight={pfeSegHighlight("3 4") ? colors.problemAccent : undefined}
            />
          </div>
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3, 4].map((i) => (
              <PairingPill
                key={i}
                label={`e${i}`}
                active={pfePairing === i}
                tone="problem"
              />
            ))}
          </div>
          <p
            className="font-mono text-[10px] mt-2.5"
            style={{ color: colors.problemAccentStrong }}
          >
            4 pairings per open · 0.723 ms/ct
          </p>
        </div>
        <div
          className="p-3.5 rounded-[10px] border"
          style={{
            background: colors.solutionBg,
            borderColor:
              "color-mix(in oklab, " + colors.solutionAccent + " 30%, transparent)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase font-semibold mb-2.5 text-solution-accent">
            BTX open
          </p>
          <div className="flex gap-1 mb-2.5">
            <Seg
              color={colors.solutionAccentLight}
              fg={colors.solutionAccent}
              label="G₁"
              flex={1}
              highlight={btxActive ? colors.solutionAccent : undefined}
            />
            <Seg
              color={colors.solutionAccent}
              fg="white"
              label="G_T"
              flex={2}
              highlight={btxActive ? colors.solutionAccent : undefined}
            />
          </div>
          <div className="flex gap-1 mb-1.5">
            <PairingPill label="e1" active={btxActive} tone="solution" />
            <div style={{ flex: 3 }} />
          </div>
          <p className="font-mono text-[10px] mt-2.5 text-solution-accent">
            1 pairing per open · 0.171 ms/ct
          </p>
        </div>
      </div>
      <p
        className="font-mono text-[11px] text-center mt-3.5"
        style={{ minHeight: 16 }}
      >
        {pfePairing !== null ? (
          <span style={{ color: colors.problemAccentStrong }}>
            PFE pairing {pfePairing}/4
          </span>
        ) : effectiveStep === 5 ? (
          <span
            className="font-semibold"
            style={{ color: colors.solutionAccent }}
          >
            BTX finished at step 1 · 4.2× faster per ct
          </span>
        ) : null}
      </p>
    </div>
  );
}

function Seg({
  color,
  fg,
  label,
  flex,
  highlight,
}: {
  color: string;
  fg: string;
  label: string;
  flex: number;
  highlight?: string;
}) {
  return (
    <div
      className="h-[26px] rounded flex items-center justify-center font-mono text-[10px] transition-[box-shadow] duration-200"
      style={{
        background: color,
        color: fg,
        flex,
        boxShadow: highlight ? `0 0 0 2px ${highlight}` : "none",
      }}
    >
      {label}
    </div>
  );
}

function PairingPill({
  label,
  active,
  tone,
}: {
  label: string;
  active: boolean;
  tone: "problem" | "solution";
}) {
  const accent =
    tone === "problem" ? colors.problemAccent : colors.solutionAccent;
  const fg = tone === "problem" ? colors.problemAccentStrong : colors.solutionAccent;
  return (
    <div
      className="h-[14px] rounded-[3px] flex items-center justify-center font-mono text-[9px] transition-all duration-200"
      style={{
        flex: 1,
        background: active
          ? accent
          : `color-mix(in oklab, ${accent} 22%, transparent)`,
        color: active ? "white" : fg,
        transform: active ? "scale(1.08)" : "scale(1)",
      }}
    >
      {label}
    </div>
  );
}
