"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FIRST_ATTEMPT_FINAL_STEP,
  RETRY_FINAL_STEP,
  RETRY_OP_IDS,
  baselineStatus,
  mip4Status,
  retryStatus,
  type BundleOpStatus,
} from "@/lib/mip4-bundle-rescue";
import { useLanguage } from "@/i18n/LanguageContext";
import { useInView } from "../useInView";

interface UserOperation {
  id: number;
  labelKey: string;
}

type DemoPhase = "first-attempt" | "retry";
type Translate = (key: string) => string;

const USER_OPERATIONS: UserOperation[] = [
  { id: 1, labelKey: "mip4.bundler.op1" },
  { id: 2, labelKey: "mip4.bundler.op2" },
  { id: 3, labelKey: "mip4.bundler.op3" },
  { id: 4, labelKey: "mip4.bundler.op4" },
  { id: 5, labelKey: "mip4.bundler.op5" },
];

const STATUS_STYLES: Record<BundleOpStatus, string> = {
  pending: "border-border bg-surface-elevated text-text-tertiary",
  executing: "border-text-primary bg-surface text-text-primary",
  success:
    "border-solution-accent-light bg-solution-bg text-solution-accent",
  included:
    "border-solution-accent-light bg-solution-bg text-solution-accent",
  flagged: "border-problem-accent bg-problem-bg text-problem-accent",
  reverted: "border-problem-cell-hover bg-problem-bg text-problem-accent",
  skipped: "border-border border-dashed bg-surface text-text-tertiary",
  omitted: "border-border border-dashed bg-surface text-text-tertiary",
};

function interpolate(
  value: string,
  replacements: Record<string, string | number>,
) {
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) =>
      result.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

function statusIcon(status: BundleOpStatus, operationId: number) {
  if (status === "executing") return "…";
  if (status === "success" || status === "included") return "✓";
  if (status === "flagged" || status === "reverted") return "×";
  if (status === "skipped" || status === "omitted") return "—";
  return operationId;
}

function statusLabel(
  status: BundleOpStatus,
  lane: "baseline" | "mip4",
  t: Translate,
) {
  if (status === "executing") return t("mip4.bundler.executing");
  if (status === "reverted") return t("mip4.bundler.rolledBack");
  if (status === "flagged") return t("mip4.bundler.probeTrue");
  if (status === "skipped") return t("mip4.bundler.notExecuted");
  if (status === "omitted") return t("mip4.bundler.removed");
  if (status === "included") return t("mip4.bundler.included");
  if (status === "success") {
    return lane === "mip4"
      ? t("mip4.bundler.probeFalse")
      : t("mip4.bundler.subcallSuccess");
  }
  return t("mip4.bundler.pending");
}

function OperationRow({
  operation,
  status,
  lane,
  t,
}: {
  operation: UserOperation;
  status: BundleOpStatus;
  lane: "baseline" | "mip4";
  t: Translate;
}) {
  const label = statusLabel(status, lane, t);

  return (
    <motion.li
      layout="position"
      aria-current={status === "executing" ? "step" : undefined}
      className={`rounded-lg border p-3 transition-colors ${STATUS_STYLES[status]}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
            status === "pending" || status === "skipped" || status === "omitted"
              ? "bg-border text-text-tertiary"
              : status === "success" || status === "included"
                ? "bg-solution-accent text-white"
                : status === "executing"
                  ? "animate-pulse bg-text-primary text-surface"
                  : "bg-problem-accent text-white"
          }`}
        >
          {statusIcon(status, operation.id)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary">
            <span className="text-text-tertiary">
              {interpolate(t("mip4.bundler.userOp"), { id: operation.id })}
            </span>{" "}
            {t(operation.labelKey)}
          </p>
          <p className="mt-1 font-mono text-[11px] leading-relaxed">
            {label}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function Lane({
  kind,
  operations,
  statuses,
  t,
}: {
  kind: "baseline" | "mip4";
  operations: UserOperation[];
  statuses: BundleOpStatus[];
  t: Translate;
}) {
  const isMip4 = kind === "mip4";

  return (
    <article
      aria-labelledby={`bundle-rescue-${kind}`}
      className={`rounded-2xl border p-4 sm:p-5 ${
        isMip4
          ? "border-solution-accent-light bg-solution-bg/30"
          : "border-problem-cell-hover bg-problem-bg/30"
      }`}
    >
      <header className="mb-4 min-h-20 border-b border-border pb-4">
        <h3
          id={`bundle-rescue-${kind}`}
          className="text-lg font-semibold tracking-tight"
        >
          {isMip4
            ? `${t("mip4.bundler.withMip4")}: ${t("mip4.bundler.withLaneTitle")}`
            : `${t("mip4.bundler.withoutMip4")}: ${t("mip4.bundler.withoutLaneTitle")}`}
        </h3>
        <p className="mt-1 text-sm font-light leading-relaxed text-text-secondary lg:min-h-12">
          {isMip4
            ? t("mip4.bundler.withLaneDesc")
            : t("mip4.bundler.withoutLaneDesc")}
        </p>
      </header>

      <ol className="space-y-2">
        {operations.map((operation, index) => (
          <OperationRow
            key={operation.id}
            operation={operation}
            status={statuses[index]}
            lane={kind}
            t={t}
          />
        ))}
      </ol>
    </article>
  );
}

function Outcome({
  tone,
  title,
  description,
}: {
  tone: "problem" | "solution" | "neutral";
  title: string;
  description: string;
}) {
  const toneClass =
    tone === "problem"
      ? "border-problem-cell-hover bg-problem-bg text-problem-accent"
      : tone === "solution"
        ? "border-solution-accent-light bg-solution-bg text-solution-accent"
        : "border-border bg-surface text-text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${toneClass}`}
    >
      <h4 className="text-base font-semibold tracking-tight">
        {title}
      </h4>
      <p className="mt-2 text-sm font-light leading-relaxed text-text-secondary">
        {description}
      </p>
    </motion.div>
  );
}

export default function BundlerComparisonSection() {
  const { ref, isVisible } = useInView(0.1);
  const { t } = useLanguage();
  const [phase, setPhase] = useState<DemoPhase>("first-attempt");
  const [firstStep, setFirstStep] = useState(0);
  const [retryStep, setRetryStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const firstAttemptComplete = firstStep >= FIRST_ATTEMPT_FINAL_STEP;
  const retryComplete = phase === "retry" && retryStep >= RETRY_FINAL_STEP;

  useEffect(() => {
    if (!isPlaying) return;

    const currentStep = phase === "retry" ? retryStep : firstStep;
    const finalStep =
      phase === "retry" ? RETRY_FINAL_STEP : FIRST_ATTEMPT_FINAL_STEP;

    if (currentStep >= finalStep) return;

    const timer = window.setTimeout(() => {
      const nextStep = Math.min(currentStep + 1, finalStep);
      if (phase === "retry") {
        setRetryStep(nextStep);
      } else {
        setFirstStep(nextStep);
      }
      if (nextStep >= finalStep) setIsPlaying(false);
    }, currentStep === 0 ? 350 : 850);

    return () => window.clearTimeout(timer);
  }, [firstStep, isPlaying, phase, retryStep]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setPhase("first-attempt");
    setFirstStep(0);
    setRetryStep(0);
  }, []);

  const runFromStart = useCallback(() => {
    setPhase("first-attempt");
    setFirstStep(0);
    setRetryStep(0);
    setIsPlaying(true);
  }, []);

  const stepForward = useCallback(() => {
    setIsPlaying(false);
    if (phase === "retry") {
      setRetryStep((step) => Math.min(step + 1, RETRY_FINAL_STEP));
    } else {
      setFirstStep((step) =>
        Math.min(step + 1, FIRST_ATTEMPT_FINAL_STEP),
      );
    }
  }, [phase]);

  const retryWithoutOffender = useCallback(() => {
    setPhase("retry");
    setRetryStep(0);
    setIsPlaying(true);
  }, []);

  const baselineStatuses = useMemo(
    () =>
      USER_OPERATIONS.map((operation) =>
        baselineStatus(operation.id, firstStep),
      ),
    [firstStep],
  );

  const mip4Statuses = useMemo(() => {
    if (phase === "retry") {
      return USER_OPERATIONS.map((operation) =>
        retryStatus(operation.id, retryStep),
      );
    }
    return USER_OPERATIONS.map((operation) =>
      mip4Status(operation.id, firstStep),
    );
  }, [firstStep, phase, retryStep]);

  const progressText = useMemo(() => {
    if (phase === "retry") {
      if (retryComplete) return t("mip4.bundler.retryComplete");
      if (retryStep === 0) return t("mip4.bundler.retryReady");
      const operationId =
        RETRY_OP_IDS[Math.min(retryStep - 1, RETRY_OP_IDS.length - 1)];
      return interpolate(t("mip4.bundler.retryingOp"), { id: operationId });
    }

    if (firstAttemptComplete) return t("mip4.bundler.comparisonComplete");
    if (firstStep === 0) return t("mip4.bundler.ready");
    if (firstStep <= USER_OPERATIONS.length) {
      return interpolate(t("mip4.bundler.executingOp"), { id: firstStep });
    }
    return t("mip4.bundler.finalCheck");
  }, [firstAttemptComplete, firstStep, phase, retryComplete, retryStep, t]);

  const canStep =
    !isPlaying &&
    ((phase === "first-attempt" && !firstAttemptComplete) ||
      (phase === "retry" && !retryComplete));

  return (
    <section
      id="bundle-rescue"
      ref={ref}
      className="relative scroll-mt-16 bg-surface px-6 py-24"
    >
      <div
        className={`section-reveal mx-auto max-w-6xl ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="mb-10 max-w-3xl">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("mip4.bundler.title")}
          </h2>
          <p className="text-lg font-light leading-relaxed text-text-secondary">
            {t("mip4.bundler.desc")}
          </p>
          <p className="mt-2 text-sm font-light leading-relaxed text-text-tertiary">
            {t("mip4.bundler.subDesc")}
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-border bg-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-text-primary">
                {t("mip4.bundler.scenario")}
              </h3>
              <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-text-secondary">
                {t("mip4.bundler.scenarioDesc")}
              </p>
            </div>

            <div className="grid shrink-0 grid-cols-[auto_auto_auto] items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                  {t("mip4.bundler.before")}
                </p>
                <p className="font-mono text-xl font-semibold tabular-nums text-text-primary">
                  22 MON
                </p>
              </div>
              <div className="text-center">
                <p className="font-mono text-[10px] text-problem-muted">−15 MON</p>
                <span aria-hidden="true" className="text-text-tertiary">
                  →
                </span>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-problem-muted">
                  {t("mip4.bundler.after")}
                </p>
                <p className="font-mono text-xl font-semibold tabular-nums text-problem-accent">
                  7 MON
                </p>
                <p className="font-mono text-[10px] text-problem-muted">
                  {t("mip4.bundler.reserveLine")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3">
          {firstAttemptComplete && phase === "first-attempt" ? (
            <button
              type="button"
              onClick={retryWithoutOffender}
              className="cursor-pointer rounded-lg border border-solution-accent bg-solution-accent px-5 py-2.5 font-mono text-xs text-white transition-colors hover:bg-solution-accent/90"
            >
              {t("mip4.bundler.removeAndRetry")}
            </button>
          ) : retryComplete ? (
            <button
              type="button"
              onClick={runFromStart}
              className="cursor-pointer rounded-lg border border-text-primary bg-text-primary px-5 py-2.5 font-mono text-xs text-surface transition-colors hover:bg-text-primary/90"
            >
              {t("mip4.bundler.replay")}
            </button>
          ) : (
            <button
              type="button"
              onClick={runFromStart}
              disabled={isPlaying}
              className={`rounded-lg border px-5 py-2.5 font-mono text-xs transition-colors ${
                isPlaying
                  ? "cursor-default border-border bg-surface text-text-tertiary"
                  : "cursor-pointer border-text-primary bg-text-primary text-surface hover:bg-text-primary/90"
              }`}
            >
              {isPlaying
                ? t("mip4.bundler.processing")
                : t("mip4.bundler.runBoth")}
            </button>
          )}

          {canStep && (
            <button
              type="button"
              onClick={stepForward}
              className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-xs text-text-primary transition-colors hover:border-text-secondary"
            >
              {t("mip4.bundler.step")}
            </button>
          )}

          <button
            type="button"
            onClick={reset}
            disabled={
              !isPlaying && phase === "first-attempt" && firstStep === 0
            }
            className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2.5 font-mono text-xs text-text-secondary transition-colors hover:border-text-secondary disabled:cursor-default disabled:text-text-tertiary"
          >
            {t("mip4.bundler.reset")}
          </button>

          <p
            aria-live="polite"
            className="ml-auto font-mono text-xs text-text-tertiary"
          >
            {progressText}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <Lane
              kind="baseline"
              operations={USER_OPERATIONS}
              statuses={baselineStatuses}
              t={t}
            />
            <AnimatePresence>
              {firstAttemptComplete && (
                <Outcome
                  tone="problem"
                  title={t("mip4.bundler.withoutOutcomeTitle")}
                  description={t("mip4.bundler.withoutOutcomeDesc")}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <Lane
              kind="mip4"
              operations={USER_OPERATIONS}
              statuses={mip4Statuses}
              t={t}
            />
            <AnimatePresence mode="wait">
              {phase === "first-attempt" && firstStep > 3 && (
                <Outcome
                  key="diagnosed"
                  tone="neutral"
                  title={t("mip4.bundler.diagnosedOutcomeTitle")}
                  description={t("mip4.bundler.diagnosedOutcomeDesc")}
                />
              )}
              {phase === "retry" && !retryComplete && (
                <Outcome
                  key="retrying"
                  tone="neutral"
                  title={t("mip4.bundler.retryOutcomeTitle")}
                  description={t("mip4.bundler.retryOutcomeDesc")}
                />
              )}
              {retryComplete && (
                <Outcome
                  key="included"
                  tone="solution"
                  title={t("mip4.bundler.successOutcomeTitle")}
                  description={t("mip4.bundler.successOutcomeDesc")}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {firstAttemptComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3"
            >
              {[
                [
                  t("mip4.bundler.detectionLabel"),
                  t("mip4.bundler.detectionWithout"),
                  t("mip4.bundler.detectionWith"),
                ],
                [
                  t("mip4.bundler.attributionLabel"),
                  t("mip4.bundler.attributionWithout"),
                  t("mip4.bundler.attributionWith"),
                ],
                [
                  t("mip4.bundler.nextActionLabel"),
                  t("mip4.bundler.nextActionWithout"),
                  t("mip4.bundler.nextActionWith"),
                ],
              ].map(([label, without, withMip4]) => (
                <div key={label} className="bg-surface-elevated p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
                    {label}
                  </p>
                  <p className="mt-2 text-sm text-problem-accent">{without}</p>
                  <p className="mt-1 text-sm text-solution-accent">
                    {withMip4}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <details className="group mt-6 rounded-xl border border-border bg-surface-elevated">
          <summary className="cursor-pointer list-none px-5 py-4 font-mono text-xs text-text-primary marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {t("mip4.bundler.inspectTrace")}
              <span
                aria-hidden="true"
                className="text-text-tertiary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <div className="grid grid-cols-1 gap-4 border-t border-border p-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-problem-accent">
                {t("mip4.bundler.withoutMip4")}
              </h4>
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed text-text-secondary">
                <code>{`CALL UserOp #3 → success
CALL UserOp #4 → success
CALL UserOp #5 → success
POST_EXEC_RESERVE_CHECK → violation
REVERT → offender unknown`}</code>
              </pre>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-solution-accent">
                {t("mip4.bundler.withMip4")}
              </h4>
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed text-text-secondary">
                <code>{`CALL UserOp #3 → success
CALL 0x1001
├─ calldata: 0x3a61584e
└─ returndata: true
REVERT BadOp(3)

RETRY [#1, #2, #4, #5] → success`}</code>
              </pre>
            </div>
            <p className="text-sm font-light leading-relaxed text-text-tertiary lg:col-span-2">
              {t("mip4.bundler.boolNote")}
            </p>
            <div className="lg:col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-text-primary">
                {t("mip4.details.usageInSolidity")}
              </h4>
              <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-xs leading-relaxed text-text-secondary">
                <code>{`for (uint256 i; i < ops.length; ++i) {
    _execute(ops[i]);

    // MIP-4 requires CALL, not STATICCALL.
    (bool ok, bytes memory out) = address(0x1001).call(
        abi.encodeWithSelector(bytes4(0x3a61584e))
    );
    require(ok && out.length == 32);
    if (abi.decode(out, (bool))) revert BadOp(i + 1);
}`}</code>
              </pre>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}
