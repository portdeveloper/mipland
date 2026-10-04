"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { storedPreference } from "@/lib/stored-preference";
import en from "./en";
import zh from "./zh";

export type Locale = "en" | "zh";

const translations = { en, zh } as const;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  showBanner: boolean;
  dismissBanner: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
  showBanner: false,
  dismissBanner: () => {},
});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

const storedLocale = storedPreference("locale");

/**
 * What the visitor's language setup asks for: a saved choice, an offer to
 * switch for a Chinese browser with no saved choice, or nothing.
 */
export type LocalePreference = Locale | "offer-zh" | "none";

export function readLocalePreference(): LocalePreference {
  const saved = storedLocale.read();
  if (saved === "en" || saved === "zh") return saved;
  // No saved preference: offer Chinese to a Chinese browser, but stay on English.
  return (navigator.language || "").startsWith("zh") ? "offer-zh" : "none";
}

export function serverLocalePreference(): LocalePreference {
  return "none";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server and hydration render English with no banner; a saved choice or the
  // Chinese-browser offer applies right after hydration.
  const preference = useSyncExternalStore(
    storedLocale.subscribe,
    readLocalePreference,
    serverLocalePreference
  );
  const locale: Locale = preference === "zh" ? "zh" : "en";
  const showBanner = preference === "offer-zh";

  const setLocale = useCallback((l: Locale) => {
    storedLocale.write(l);
    document.documentElement.lang = l;
  }, []);

  // Save English preference so banner doesn't show again
  const dismissBanner = useCallback(() => storedLocale.write("en"), []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(
        translations[locale] as unknown as Record<string, unknown>,
        key
      );
    },
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, showBanner, dismissBanner }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
