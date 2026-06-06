"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

/* In a fixed 1.2s window: 3 blocks at 400ms vs 4 blocks at 300ms.
   The faster blocks are drawn 25% shorter to mirror the smaller per-block limits. */
function BlockCadence({ label, count, color, heightPct }: {
  label: string;
  count: number;
  color: string;
  heightPct: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[11px] text-text-tertiary">{label}</p>
      <div className="flex items-end gap-1.5 h-16">
        {Array.from({ length: count }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            whileInView={{ opacity: 1, scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-sm origin-bottom"
            style={{ backgroundColor: color, height: `${heightPct}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function WhyProportionalSection() {
  const { t } = useLanguage();

  return (
    <section className="py-20 sm:py-28 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-5">
            {t("mip12.why.title")}
          </h2>
          <p className="text-base sm:text-lg text-text-secondary font-light leading-relaxed mb-10">
            {t("mip12.why.body")}
          </p>
        </motion.div>

        {/* Cadence diagram: same 1.2s window */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bg-surface-elevated rounded-2xl border border-border p-6 sm:p-8 mb-12"
        >
          <div className="grid grid-cols-2 gap-6 sm:gap-10">
            <BlockCadence
              label="400 ms · 3 blocks"
              count={3}
              color="#9b9084"
              heightPct={100}
            />
            <BlockCadence
              label="300 ms · 4 blocks"
              count={4}
              color="#2a7d6a"
              heightPct={75}
            />
          </div>
          <p className="font-mono text-[10px] text-text-tertiary mt-5 text-center">
            same 1.2s window · more blocks, each 25% smaller
          </p>
        </motion.div>

        {/* Scope note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border bg-surface p-6 sm:p-7"
        >
          <p className="font-mono text-[11px] text-text-tertiary tracking-widest uppercase mb-2">
            {t("mip12.why.scopeTitle")}
          </p>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            {t("mip12.why.scopeBody")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
