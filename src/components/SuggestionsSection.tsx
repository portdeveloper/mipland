"use client";

import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";
import { suggestionsFor, type MipSlug } from "@/data/suggestions";
import SuggestionCard from "./SuggestionCard";

export default function SuggestionsSection({ mip }: { mip: MipSlug }) {
  const { ref, isVisible } = useInView(0.1);
  const { t } = useLanguage();
  const suggestions = suggestionsFor(mip);

  if (suggestions.length === 0) return null;

  const mipKey = mip.replace("-", ""); // "mip-3" -> "mip3"

  return (
    <section ref={ref} className="py-24 px-6 bg-surface relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${
          isVisible ? "visible" : ""
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t(`${mipKey}.suggestions.title`)}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t(`${mipKey}.suggestions.desc`)}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-10">
          {t("suggestions.proofDisclaimer")}
        </p>

        <div className="space-y-6">
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              index={i}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
