"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

const TABS = [
  { name: "MIP-8", href: "/mip-8", ready: true },
  { name: "MIP-3", href: "/mip-3", ready: true },
  { name: "MIP-4", href: "/mip-4", ready: true },
  { name: "MIP-7", href: "/mip-7", ready: true },
  { name: "MIP-12", href: "/mip-12", ready: true },
];

export default function MipNav() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 bg-background/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 pb-2">
        <div className="bg-surface-elevated/90 border border-border rounded-2xl shadow-sm flex items-center h-12 pl-3 pr-2 sm:pl-4 sm:pr-3 gap-2 sm:gap-3">
          <Link
            href="/"
            className="font-mono text-xs text-text-tertiary hover:text-text-primary transition-colors whitespace-nowrap flex-shrink-0 inline-flex items-center"
          >
            {t("nav.brand")}
          </Link>
          <span className="self-center h-5 w-px bg-border flex-shrink-0 hidden sm:block" />
          <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const isActive = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`inline-flex items-center h-8 font-mono text-xs px-2.5 sm:px-3 rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? "bg-text-primary text-surface"
                      : tab.ready
                      ? "text-text-secondary hover:text-text-primary hover:bg-surface"
                      : "text-text-tertiary cursor-default"
                  }`}
                >
                  {tab.name}
                  {!tab.ready && (
                    <span className="ml-1.5 text-[10px] opacity-50">{t("nav.soon")}</span>
                  )}
                </Link>
              );
            })}
          </div>
          <span className="self-center h-5 w-px bg-border flex-shrink-0" />
          <button
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="inline-flex items-center justify-center h-8 font-mono text-xs px-2.5 sm:px-3 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-all whitespace-nowrap flex-shrink-0"
          >
            {locale === "en" ? "中文" : "EN"}
          </button>
        </div>
      </div>
    </nav>
  );
}
