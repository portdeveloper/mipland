"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Suggestion } from "@/data/suggestions";
import { MEASUREMENT_CHAIN_ID } from "@/data/suggestions";

const MONADSCAN_TX_BASE =
  MEASUREMENT_CHAIN_ID === 143
    ? "https://monadscan.com/tx/"
    : "https://testnet.monadexplorer.com/tx/";

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2 7H12M12 7L7 2M12 7L7 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProofLink({
  txHash,
  label,
  pending,
}: {
  txHash: `0x${string}` | null;
  label: string;
  pending: string;
}) {
  if (!txHash) {
    return (
      <span className="font-mono text-xs text-text-tertiary">{pending}</span>
    );
  }
  return (
    <a
      href={`${MONADSCAN_TX_BASE}${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
    >
      {label}
      <ArrowIcon />
    </a>
  );
}

function CodeBlock({
  label,
  code,
  variant,
}: {
  label: string;
  code: string;
  variant: "problem" | "solution";
}) {
  const tone =
    variant === "problem"
      ? "border-border bg-surface-elevated"
      : "border-solution-accent-light bg-surface-elevated";
  const labelTone =
    variant === "problem"
      ? "text-problem-muted"
      : "text-solution-muted";
  return (
    <div className={`rounded-xl border ${tone} p-4`}>
      <p
        className={`font-mono text-xs uppercase tracking-wider mb-3 ${labelTone}`}
      >
        {label}
      </p>
      <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-text-primary">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SuggestionCard({
  suggestion,
  index,
  isVisible,
}: {
  suggestion: Suggestion;
  index: number;
  isVisible: boolean;
}) {
  const { t } = useLanguage();
  const { proof } = suggestion;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: index * 0.15,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
    >
      <header className="mb-6">
        <p className="font-mono text-xs text-text-tertiary mb-2">
          {t("suggestions.patternLabel")} {suggestion.id.toUpperCase()}
        </p>
        <h3 className="text-xl sm:text-2xl font-semibold tracking-tight mb-2">
          {t(suggestion.titleKey)}
        </h3>
        <p className="text-base text-text-secondary font-light leading-relaxed">
          {t(suggestion.summaryKey)}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CodeBlock
          label={t("suggestions.before")}
          code={suggestion.beforeCode}
          variant="problem"
        />
        <CodeBlock
          label={t("suggestions.after")}
          code={suggestion.afterCode}
          variant="solution"
        />
      </div>

      <ProofRow proof={proof} t={t} />

      <p className="text-sm text-text-secondary font-light leading-relaxed mt-6 max-w-3xl">
        {t(suggestion.explanationKey)}
      </p>
    </motion.article>
  );
}

function ProofRow({
  proof,
  t,
}: {
  proof: Suggestion["proof"];
  t: (key: string) => string;
}) {
  if (proof.kind === "gas-delta") {
    const { beforeTx, afterTx, beforeGas, afterGas, beforeNote } = proof;
    const savingsPct =
      beforeGas != null && afterGas != null && beforeGas > 0
        ? ((beforeGas - afterGas) / beforeGas) * 100
        : null;
    const savingsLabel =
      savingsPct == null
        ? "—"
        : Math.abs(savingsPct) < 0.5
        ? "≈ 0%"
        : savingsPct > 0
        ? `−${Math.round(savingsPct)}%`
        : `+${Math.round(-savingsPct)}%`;
    const savingsTone =
      savingsPct == null || Math.abs(savingsPct) < 0.5
        ? "text-text-tertiary"
        : savingsPct > 0
        ? "text-solution-accent"
        : "text-problem-accent";
    return (
      <div className="border-t border-border pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-problem-muted mb-1.5">
              {t("suggestions.before")}
            </p>
            {beforeGas != null ? (
              <p className="font-mono text-sm text-text-primary mb-1">
                {beforeGas.toLocaleString()} gas
              </p>
            ) : beforeNote ? null : (
              <p className="font-mono text-sm text-text-tertiary mb-1">
                {t("suggestions.pendingMeasurement")}
              </p>
            )}
            {beforeNote ? (
              <p className="font-mono text-[11px] text-text-tertiary leading-snug">
                {beforeNote}
              </p>
            ) : (
              <ProofLink
                txHash={beforeTx}
                label={t("suggestions.verifyOnMonadscan")}
                pending={t("suggestions.pendingDeploy")}
              />
            )}
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-solution-muted mb-1.5">
              {t("suggestions.after")}
            </p>
            <p className="font-mono text-sm text-text-primary mb-1">
              {afterGas != null
                ? `${afterGas.toLocaleString()} gas`
                : t("suggestions.pendingMeasurement")}
            </p>
            <ProofLink
              txHash={afterTx}
              label={t("suggestions.verifyOnMonadscan")}
              pending={t("suggestions.pendingDeploy")}
            />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-text-tertiary mb-1.5">
              {t("suggestions.savings")}
            </p>
            <p className={`font-mono text-xl ${savingsTone}`}>{savingsLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  // behavior
  const { beforeTx, afterTx, beforeLabel, afterLabel } = proof;
  return (
    <div className="border-t border-border pt-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-problem-muted mb-2">
            {t("suggestions.beforeBehavior")}
          </p>
          <p className="text-sm text-text-secondary font-light leading-relaxed mb-2">
            {beforeLabel}
          </p>
          <ProofLink
            txHash={beforeTx}
            label={t("suggestions.viewFailingTx")}
            pending={t("suggestions.pendingDeploy")}
          />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-solution-muted mb-2">
            {t("suggestions.afterBehavior")}
          </p>
          <p className="text-sm text-text-secondary font-light leading-relaxed mb-2">
            {afterLabel}
          </p>
          <ProofLink
            txHash={afterTx}
            label={t("suggestions.viewFailingTx")}
            pending={t("suggestions.pendingDeploy")}
          />
        </div>
      </div>
    </div>
  );
}
