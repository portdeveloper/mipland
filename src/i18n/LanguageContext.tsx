"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
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

const emptySubscribe = () => () => {};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale");
      if (saved === "en" || saved === "zh") return saved;
    }
    return "en";
  });

  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("locale");
      if (saved !== "en" && saved !== "zh") {
        const lang = navigator.language || "";
        return lang.startsWith("zh");
      }
    }
    return false;
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
    setShowBanner(false);
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    // Save English preference so banner doesn't show again
    localStorage.setItem("locale", "en");
  }, []);

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

  if (!isClient) {
    return (
      <LanguageContext.Provider
        value={{
          locale: "en",
          setLocale,
          t: (key: string) =>
            getNestedValue(
              translations.en as unknown as Record<string, unknown>,
              key
            ),
          showBanner: false,
          dismissBanner,
        }}
      >
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, showBanner, dismissBanner }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
