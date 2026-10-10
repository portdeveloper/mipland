"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

interface SkippedGroup {
  key: string;
  eips: string[];
  href?: string;
}

const GROUPS: SkippedGroup[] = [
  { key: "bal", eips: ["7928"], href: "/async-execution" },
  { key: "consensus", eips: ["8045", "8061", "8282", "7688", "7732"] },
  { key: "gas", eips: ["2780", "7778", "7976", "8037", "8038"] },
  { key: "size", eips: ["7954"] },
  { key: "net", eips: [] },
];

export default function SkippedEipsSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
            {t("mip15.skipped.title")}
          </h2>
          <p className="text-base text-text-secondary font-light leading-relaxed">
            {t("mip15.skipped.subtitle")}
          </p>
        </motion.div>

        <div className="space-y-3">
          {GROUPS.map((g, i) => (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-2xl border p-5 sm:p-6 ${
                i === 0
                  ? "border-problem-accent/30 bg-surface-elevated"
                  : "border-border bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-2">
                <h3 className="text-base sm:text-lg font-semibold">
                  {t(`mip15.skipped.${g.key}Name`)}
                </h3>
                {g.eips.length > 0 && (
                  <p className="font-mono text-[10px] text-text-tertiary">
                    {g.eips.map((n) => `EIP-${n}`).join(" · ")}
                  </p>
                )}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t(`mip15.skipped.${g.key}Body`)}
              </p>
              {g.href && (
                <Link
                  href={g.href}
                  className="inline-block mt-3 font-mono text-xs text-text-tertiary hover:text-text-secondary underline underline-offset-2 decoration-text-tertiary/40"
                >
                  {t(`mip15.skipped.${g.key}Link`)} →
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
