"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

export const ADOPTED_COUNT = 6;
// Named exclusions in the MIP: EIP-7928, five consensus-layer EIPs, five
// gas-model EIPs and EIP-7954. Networking and informational EIPs are unnamed.
export const SKIPPED_COUNT = 12;

export default function Mip15HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl relative z-10 mt-30"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-10">
          {t("mip15.hero.title")}
        </h1>

        <div className="flex items-end justify-center gap-8 sm:gap-14 mb-4">
          <div className="flex flex-col items-center">
            <span className="font-mono text-6xl sm:text-8xl md:text-9xl font-semibold tabular-nums leading-none text-solution-accent">
              {ADOPTED_COUNT}
            </span>
            <span className="font-mono text-sm text-text-tertiary mt-3">
              {t("mip15.hero.adopted")}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-5xl sm:text-7xl md:text-8xl font-light tabular-nums leading-none text-problem-accent/70">
              {SKIPPED_COUNT}
            </span>
            <span className="font-mono text-sm text-text-tertiary mt-3">
              {t("mip15.hero.skipped")}
            </span>
          </div>
        </div>
        <p className="font-mono text-[11px] text-text-tertiary mb-8">
          {t("mip15.hero.skippedNote")}
        </p>

        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip15.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>
    </section>
  );
}
