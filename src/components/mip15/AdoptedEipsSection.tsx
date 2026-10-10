"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const EIPS = ["7708", "7843", "7981", "7997", "8024", "8246"] as const;

const EIP_URL = (n: string) =>
  `https://github.com/ethereum/EIPs/blob/b6d3f2c65aad65bb09856db6db50ae612b8bf8aa/EIPS/eip-${n}.md`;

export default function AdoptedEipsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip15.adopted.title")}
          </h2>
          <p className="text-base text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
            {t("mip15.adopted.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EIPS.map((n, i) => (
            <motion.div
              key={n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: (i % 3) * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="bg-surface-elevated rounded-2xl border border-border p-6 flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <a
                  href={EIP_URL(n)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-text-tertiary hover:text-text-secondary underline underline-offset-2 decoration-text-tertiary/40"
                >
                  EIP-{n}
                </a>
                <span className="font-mono text-[10px] text-text-tertiary rounded-full border border-border px-2 py-0.5">
                  {t(`mip15.adopted.e${n}Who`)}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t(`mip15.adopted.e${n}Name`)}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-5">
                {t(`mip15.adopted.e${n}What`)}
              </p>
              <div className="mt-auto rounded-xl bg-solution-bg border border-solution-accent/20 p-4">
                <p className="font-mono text-[10px] tracking-widest uppercase text-solution-accent mb-1.5">
                  {t("mip15.adopted.onMonad")}
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {t(`mip15.adopted.e${n}Monad`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
