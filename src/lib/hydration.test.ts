import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ExplainModeProvider,
  readExplainMode,
  useExplainMode,
} from "@/components/spam-mev/ExplainModeContext";
import { readHashCategory, serverHashCategory } from "@/components/infra/InfraContent";
import { LanguageProvider, readLocalePreference, useLanguage } from "@/i18n/LanguageContext";

// Storage and window are both present, so a provider that read the saved value
// while rendering (a state initializer, say) would leak it into this server render.
function stubStorage(entries: Record<string, string>) {
  const store = new Map(Object.entries(entries));
  vi.stubGlobal("window", { location: { hash: "" } });
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  });
}

function ModeProbe() {
  return createElement("span", null, useExplainMode().mode);
}

function LanguageProbe() {
  const { locale, showBanner, t } = useLanguage();
  return createElement("span", null, `${locale}|${showBanner}|${t("nav.clearSigning")}`);
}

function render(provider: (props: { children: ReactNode }) => ReactNode, probe: () => ReactNode) {
  return renderToString(createElement(provider, null, createElement(probe)));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("saved preferences apply after hydration, never during it", () => {
  it("renders the technical explain mode on the server even when simple is saved", () => {
    stubStorage({ "spam-mev-mode": "simple" });
    expect(render(ExplainModeProvider, ModeProbe)).toContain("technical");
    // The client snapshot used right after hydration picks up the saved mode.
    expect(readExplainMode()).toBe("simple");
  });

  it("renders English with no banner on the server even when Chinese is saved", () => {
    stubStorage({ locale: "zh" });
    vi.stubGlobal("navigator", { language: "zh-CN" });
    expect(render(LanguageProvider, LanguageProbe)).toContain("en|false|Clear Signing");
    expect(readLocalePreference()).toBe("zh");
  });

  it("offers Chinese to a Chinese browser only when nothing is saved", () => {
    vi.stubGlobal("navigator", { language: "zh-CN" });
    stubStorage({});
    expect(readLocalePreference()).toBe("offer-zh");
    stubStorage({ locale: "en" });
    expect(readLocalePreference()).toBe("en");
  });

  it("restores only a ready tab from the URL hash, and only on the client", () => {
    expect(serverHashCategory()).toBeNull();
    vi.stubGlobal("window", { location: { hash: "#indexers" } });
    expect(readHashCategory()).toBe("indexers");
    vi.stubGlobal("window", { location: { hash: "#bridges" } });
    expect(readHashCategory()).toBeNull();
  });
});
