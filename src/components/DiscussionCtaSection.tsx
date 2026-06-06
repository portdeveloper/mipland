"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

const FORUM_URLS: Record<string, string> = {
  "/mip-8": "https://forum.monad.xyz/t/mip-8-page-ified-storage-state/407",
  "/mip-3": "https://forum.monad.xyz/t/mip-3-linear-evm-memory-cost/362",
  "/mip-4": "https://forum.monad.xyz/t/mip-4-reserve-balance-introspection/363",
  "/mip-7": "https://forum.monad.xyz/t/mip-7-extension-opcodes/",
  "/mip-12": "https://forum.monad.xyz/t/mip-12-decrease-vote-pace/488",
};

export default function DiscussionCtaSection() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const forumUrl = FORUM_URLS[pathname] || FORUM_URLS["/mip-8"];

  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
          {t("discussion.title")}
        </h2>
        <p className="text-base text-text-secondary font-light mb-8">
          {t("discussion.desc")}
        </p>
        <a
          href={forumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-5 py-3 text-sm font-medium text-text-primary transition-colors hover:border-text-primary"
        >
          {t("discussion.openThread")}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7H12M12 7L7 2M12 7L7 12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
