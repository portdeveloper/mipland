"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import SpecDisclaimer from "@/components/SpecDisclaimer";

export default function Mip12HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="min-h-[80vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl relative z-10 mt-30"
      >
        <p className="font-mono text-xs text-text-tertiary tracking-widest uppercase mb-6">
          MIP-12 · {t("mip12.hero.caption")}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-10">
          {t("mip12.hero.title")}
        </h1>

        {/* Big before → after */}
        <div className="flex items-end justify-center gap-4 sm:gap-7 mb-4">
          <div className="flex flex-col items-center">
            <span className="font-mono text-5xl sm:text-7xl md:text-8xl font-light tabular-nums leading-none text-problem-accent/70 line-through decoration-problem-accent/40 decoration-[3px]">
              400
            </span>
          </div>
          <motion.svg
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-4 text-text-tertiary shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14m0 0l-6-6m6 6l-6 6"
            />
          </motion.svg>
          <div className="flex flex-col items-center">
            <span className="font-mono text-6xl sm:text-8xl md:text-9xl font-semibold tabular-nums leading-none text-solution-accent">
              300
            </span>
          </div>
        </div>
        <p className="font-mono text-sm text-text-tertiary mb-8">
          {t("mip12.hero.unit")} {t("mip12.hero.caption")}{" "}
          <span className="text-solution-accent font-semibold">
            {t("mip12.hero.delta")}
          </span>
        </p>

        <p className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto leading-relaxed">
          {t("mip12.hero.desc")}
        </p>
        <SpecDisclaimer />
      </motion.div>
    </section>
  );
}
