"use client";

import { motion } from "framer-motion";
import { useExplainMode } from "./ExplainModeContext";

export default function ModeToggle() {
  const { mode, toggle } = useExplainMode();
  const isSimple = mode === "simple";

  return (
    <button
      onClick={toggle}
      aria-pressed={isSimple}
      aria-label="Explain Like I'm 5 mode"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 font-mono text-xs cursor-pointer select-none bg-surface-elevated rounded-full border border-border px-4 py-2.5 shadow-lg hover:shadow-xl transition-shadow"
    >
      <span className={`transition-colors ${isSimple ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>
        Explain Like I&apos;m 5
      </span>
      <div className={`relative w-8 h-[18px] rounded-full transition-colors ${isSimple ? "bg-text-primary" : "bg-border"}`}>
        <motion.div
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-surface shadow-sm"
          animate={{ left: isSimple ? 14 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
