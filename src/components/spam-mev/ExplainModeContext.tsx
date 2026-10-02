"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { storedPreference } from "@/lib/stored-preference";

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

const stored = storedPreference(STORAGE_KEY);

export function readExplainMode(): ExplainMode {
  return stored.read() === "simple" ? "simple" : "technical";
}

export function serverExplainMode(): ExplainMode {
  return "technical";
}

export function ExplainModeProvider({ children }: { children: ReactNode }) {
  // Server and hydration render "technical"; a saved mode applies right after.
  const mode = useSyncExternalStore(stored.subscribe, readExplainMode, serverExplainMode);

  const toggle = () => stored.write(mode === "simple" ? "technical" : "simple");

  return (
    <Context.Provider value={{ mode, toggle }}>{children}</Context.Provider>
  );
}

export function useExplainMode() {
  return useContext(Context);
}
