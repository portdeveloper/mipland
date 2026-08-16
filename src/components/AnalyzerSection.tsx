"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "./useInView";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AnalyzerSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useInView(0.1);
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleAnalyze = () => {
    if (!input.trim()) return;
    router.push(`/analyzer?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <section ref={ref} className="py-24 px-6 bg-surface-elevated relative">
      <div
        className={`max-w-5xl mx-auto section-reveal ${isVisible ? "visible" : ""}`}
      >
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">
          {t("mip8.analyzer.title")}
        </h2>
        <p className="text-lg text-text-secondary font-light max-w-3xl leading-relaxed mb-2">
          {t("mip8.analyzer.desc")}
        </p>
        <p className="text-sm text-text-tertiary font-light max-w-3xl leading-relaxed mb-6">
          {t("mip8.analyzer.note")}
        </p>

        <div
          className="flex flex-wrap items-center gap-2 mb-4"
          role="group"
          aria-label="Example repositories"
        >
          <span className="font-mono text-xs text-text-tertiary">{t("mip8.analyzer.tryLabel")}</span>
          {[
            { name: "Uniswap V2", url: "https://github.com/Uniswap/v2-core" },
            { name: "Uniswap V3", url: "https://github.com/Uniswap/v3-core" },
            { name: "solmate", url: "https://github.com/transmissions11/solmate" },
            { name: "OpenZeppelin", url: "https://github.com/OpenZeppelin/openzeppelin-contracts" },
          ].map((repo) => (
            <button
              key={repo.url}
              onClick={() => router.push(`/analyzer?q=${encodeURIComponent(repo.url)}`)}
              type="button"
              aria-label={`Analyze ${repo.name}`}
              className="font-mono text-xs px-2.5 py-1 rounded-md border border-border bg-surface hover:border-text-secondary hover:bg-surface-elevated transition-all cursor-pointer"
            >
              {repo.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            aria-label="Repository URL to analyze"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/Uniswap/v2-core"
            className="flex-1 font-mono text-xs bg-surface border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-text-secondary"
          />
          <button
            onClick={handleAnalyze}
            disabled={!input.trim()}
            className={`font-mono text-xs px-5 py-3 rounded-lg border transition-all shrink-0 ${
              !input.trim()
                ? "bg-surface border-border text-text-tertiary cursor-default"
                : "bg-solution-accent text-white border-solution-accent hover:bg-solution-accent/90 cursor-pointer"
            }`}
          >
            {t("mip8.analyzer.analyze")}
          </button>
        </div>
      </div>
    </section>
  );
}
