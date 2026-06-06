"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

interface ParamCard {
  raw: string;
  nameKey: string;
  meaningKey: string;
  before: string;
  after: string;
  unit?: string;
  exact?: string;
}

const PARAMS: ParamCard[] = [
  {
    raw: "tx_limit",
    nameKey: "mip12.params.txName",
    meaningKey: "mip12.params.txMeaning",
    before: "5,000",
    after: "3,750",
  },
  {
    raw: "proposal_gas_limit",
    nameKey: "mip12.params.gasName",
    meaningKey: "mip12.params.gasMeaning",
    before: "200M",
    after: "150M",
    exact: "200,000,000 → 150,000,000",
  },
  {
    raw: "proposal_byte_limit",
    nameKey: "mip12.params.bytesName",
    meaningKey: "mip12.params.bytesMeaning",
    before: "2M",
    after: "1.5M",
    exact: "2,000,000 → 1,500,000 bytes",
  },
  {
    raw: "block_reward",
    nameKey: "mip12.params.rewardName",
    meaningKey: "mip12.params.rewardMeaning",
    before: "25",
    after: "18",
    unit: "MON",
  },
];

export default function ParameterChangesSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip12.params.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip12.params.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARAMS.map((p, i) => (
            <motion.div
              key={p.raw}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-surface-elevated rounded-2xl border border-border p-6 sm:p-7 flex flex-col"
            >
              {/* Friendly name + raw key */}
              <h3 className="text-lg font-semibold mb-0.5">{t(p.nameKey)}</h3>
              <p className="font-mono text-[11px] text-text-tertiary mb-5">
                {p.raw}
              </p>

              {/* before → after */}
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-mono text-2xl sm:text-3xl font-light tabular-nums text-problem-accent/70 line-through decoration-problem-accent/30">
                  {p.before}
                </span>
                <svg
                  className="w-4 h-4 text-text-tertiary shrink-0 self-center"
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
                <span className="font-mono text-3xl sm:text-4xl font-semibold tabular-nums text-solution-accent">
                  {p.after}
                </span>
                {p.unit && (
                  <span className="font-mono text-sm text-text-tertiary self-end pb-1">
                    {p.unit}
                  </span>
                )}
              </div>
              {p.exact && (
                <p className="font-mono text-[10px] text-text-tertiary mb-4">
                  {p.exact}
                </p>
              )}

              {/* Plain-language meaning */}
              <p className="text-sm text-text-secondary leading-relaxed mt-auto pt-4">
                {t(p.meaningKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
