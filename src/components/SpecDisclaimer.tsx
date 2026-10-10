"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

const SPEC_URLS: Record<string, { url: string; mip: string }> = {
  "/mip-3": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPs/MIP-3.md",
    mip: "MIP-3",
  },
  "/mip-4": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPs/MIP-4.md",
    mip: "MIP-4",
  },
  "/mip-7": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPs/MIP-7.md",
    mip: "MIP-7",
  },
  "/mip-8": {
    url: "https://github.com/monad-crypto/MIPs/blob/main/MIPs/MIP-8.md",
    mip: "MIP-8",
  },
  "/mip-12": {
    url: "https://github.com/monad-crypto/MIPs/blob/2a7e18894f1e55fb043080cb8cef15c7f5647768/MIPs/MIP-12.md",
    mip: "MIP-12",
  },
  "/mip-15": {
    url: "https://github.com/monad-crypto/MIPs/blob/282d18125d6590447d9229550887581385649e48/MIPs/MIP-15.md",
    mip: "MIP-15",
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
