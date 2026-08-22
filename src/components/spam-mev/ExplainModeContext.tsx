"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type ExplainMode = "simple" | "technical";

const STORAGE_KEY = "spam-mev-mode";

interface ExplainModeContextType {
  mode: ExplainMode;
  toggle: () => void;
}

const Context = createContext<ExplainModeContextType>({
  mode: "technical",
  toggle: () => {},
});

function readStored(): ExplainMode {
  if (typeof window === "undefined") return "technical";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "simple" ? "simple" : "technical";
}

export function ExplainModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ExplainMode>(readStored);

  const toggle = () =>
    setMode((m) => {
      const next = m === "simple" ? "technical" : "simple";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });

  return (
    <Context.Provider value={{ mode, toggle }}>{children}</Context.Provider>
  );
}

export function useExplainMode() {
  return useContext(Context);
}
