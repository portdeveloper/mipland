"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const SYSTEM_ADDRESS = "0xffff…fffe";
const TRANSFER_TOPIC = "0xddf252ad…b3ef";

interface TransferLog {
  from: string;
  to: string;
  amount: string;
}

interface Scenario {
  id: string;
  key: string;
  logs: TransferLog[];
  noteKey?: string;
}

// EIP-7708: one log per nonzero-value transfer to a different account, at the
// transaction level and for each CALL / CREATE / CREATE2 / SELFDESTRUCT.
const SCENARIOS: Scenario[] = [
  {
    id: "send",
    key: "send",
    logs: [{ from: "alice", to: "bob", amount: "1 MON" }],
  },
  {
    id: "router",
    key: "router",
    logs: [
      { from: "alice", to: "router", amount: "1 MON" },
      { from: "router", to: "bob", amount: "1 MON" },
    ],
  },
  { id: "zero", key: "zero", logs: [], noteKey: "mip15.logs.zeroNote" },
  {
    id: "create",
    key: "create",
    logs: [
      { from: "alice", to: "factory", amount: "0.5 MON" },
      { from: "factory", to: "child", amount: "0.5 MON" },
    ],
  },
  { id: "self", key: "self", logs: [], noteKey: "mip15.logs.selfNote" },
];

export default function TransferLogsSection() {
  const { t } = useLanguage();
  const [active, setActive] = useState(SCENARIOS[1].id);
  const scenario = SCENARIOS.find((s) => s.id === active) ?? SCENARIOS[0];
  const count = scenario.logs.length;

  return (
    <section className="py-20 sm:py-28 px-6 bg-surface-alt">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip15.logs.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip15.logs.subtitle")}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-6" role="tablist">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === active}
              onClick={() => setActive(s.id)}
              className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
                s.id === active
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary border-border hover:border-text-tertiary"
              }`}
            >
              {t(`mip15.logs.${s.key}Name`)}
            </button>
          ))}
        </div>

        <p className="text-sm text-text-secondary text-center mb-8 min-h-[2.5rem] max-w-xl mx-auto">
          {t(`mip15.logs.${scenario.key}Desc`)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-text-tertiary mb-4">
              {t("mip15.logs.before")}
            </p>
            <p className="font-mono text-sm text-text-tertiary">
              {t("mip15.logs.noLogs")}
            </p>
          </div>

          <div className="rounded-2xl border border-solution-accent/30 bg-surface-elevated p-5">
            <p className="font-mono text-[11px] tracking-widest uppercase text-solution-accent mb-4">
              {t("mip15.logs.after")} · {count}{" "}
              {count === 1 ? t("mip15.logs.logCount") : t("mip15.logs.logsCount")}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {count === 0 ? (
                  <p className="text-sm text-text-secondary">
                    {scenario.noteKey && t(scenario.noteKey)}
                  </p>
                ) : (
                  scenario.logs.map((log, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-solution-bg border border-solution-accent/20 px-4 py-3 font-mono text-xs grid grid-cols-[auto_1fr] gap-x-4 gap-y-1"
                    >
                      <span className="text-text-tertiary">{t("mip15.logs.from")}</span>
                      <span className="text-text-primary">{log.from}</span>
                      <span className="text-text-tertiary">{t("mip15.logs.to")}</span>
                      <span className="text-text-primary">{log.to}</span>
                      <span className="text-text-tertiary">{t("mip15.logs.amount")}</span>
                      <span className="text-solution-accent font-semibold">
                        {log.amount}
                      </span>
                    </div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 font-mono text-[11px] text-text-tertiary text-center space-y-1">
          <p>
            {t("mip15.logs.emitter")} {SYSTEM_ADDRESS}
          </p>
          <p>
            {t("mip15.logs.topic")} {TRANSFER_TOPIC} · {t("mip15.logs.topicNote")}
          </p>
        </div>
      </div>
    </section>
  );
}
