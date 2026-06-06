"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageContext";

const FOOTER_DATA: Record<string, { specUrl: string; specLabel: string; noteKey: string }> = {
  "/mip-8": {
    specUrl: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-8.md",
    specLabel: "MIP-8 on GitHub",
    noteKey: "footer.mip8Note",
  },
  "/mip-3": {
    specUrl: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-3.md",
    specLabel: "MIP-3 on GitHub",
    noteKey: "footer.mip3Note",
  },
  "/mip-4": {
    specUrl: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-4.md",
    specLabel: "MIP-4 on GitHub",
    noteKey: "footer.mip4Note",
  },
  "/mip-7": {
    specUrl: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-7.md",
    specLabel: "MIP-7 on GitHub",
    noteKey: "footer.mip7Note",
  },
  "/mip-12": {
    specUrl: "https://github.com/monad-crypto/MIPs/blob/main/MIPS/MIP-12.md",
    specLabel: "MIP-12 on GitHub",
    noteKey: "footer.mip12Note",
  },
};

export default function FooterSection() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const data = FOOTER_DATA[pathname] || FOOTER_DATA["/mip-8"];

  return (
    <footer className="py-16 px-6 bg-text-primary text-surface">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-surface/50 mb-3">
              {t("footer.readSpec")}
            </p>
            <a
              href={data.specUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-surface/80 hover:text-surface transition-colors underline underline-offset-4 decoration-surface/20 hover:decoration-surface/60"
            >
              {data.specLabel} →
            </a>
          </div>
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-surface/50 mb-3">
              {t("footer.about")}
            </p>
            <p className="text-sm text-surface/60">
              {t(data.noteKey)}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-surface/10 flex items-center justify-center">
          <p className="font-mono text-xs text-surface/30">
            {t("footer.madeBy")}{" "}
            <a
              href="https://x.com/port_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surface/50 hover:text-surface transition-colors underline underline-offset-2"
            >
              port
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
