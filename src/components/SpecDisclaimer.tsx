"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

const SPEC_URLS: Record<string, { url: string; mip: string }> = {
  "/mip-3": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-3.md",
    mip: "MIP-3",
  },
  "/mip-4": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-4.md",
    mip: "MIP-4",
  },
  "/mip-7": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-7.md",
    mip: "MIP-7",
  },
  "/mip-8": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-8.md",
    mip: "MIP-8",
  },
  "/mip-12": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-12.md",
    mip: "MIP-12",
  },
};

export default function SpecDisclaimer() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const data = SPEC_URLS[pathname];
  if (!data) return null;

  return (
    <p className="font-mono text-[11px] text-text-tertiary mt-8 max-w-xl mx-auto text-center leading-relaxed">
      {t("specDisclaimer.prefix")}
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 decoration-text-tertiary/40 hover:text-text-secondary hover:decoration-text-secondary transition-colors"
      >
        {data.mip}
      </a>
      {t("specDisclaimer.suffix")}
    </p>
  );
}
