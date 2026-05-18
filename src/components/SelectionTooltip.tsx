"use client";

import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MAX_SNIPPET = 500;
const MIN_LEN = 3;

type Pos = { left: number; top: number };

function isInsideExcluded(node: Node | null): boolean {
  let n: Node | null = node;
  while (n) {
    if (n.nodeType === 1) {
      const el = n as Element;
      if (el.closest?.('[data-mip-chat="true"]')) return true;
      if (el.id === "mip-chat-ask-ai") return true;
    }
    n = n.parentNode;
  }
  return false;
}

export default function SelectionTooltip() {
  const pathname = usePathname();
  const [pos, setPos] = useState<Pos | null>(null);
  const textRef = useRef("");

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    function update() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setPos(null);
        return;
      }
      const selected = sel.toString().trim();
      if (selected.length < MIN_LEN) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (isInsideExcluded(range.commonAncestorContainer)) {
        setPos(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      textRef.current = selected.slice(0, MAX_SNIPPET);
      // Anchor under the right edge of the selection, clamped to viewport.
      const left = Math.min(rect.right, window.innerWidth - 110);
      const top = Math.min(rect.bottom + 8, window.innerHeight - 40);
      setPos({ left, top });
    }

    document.addEventListener("selectionchange", update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      document.removeEventListener("selectionchange", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  if (!pos) return null;

  return (
    <button
      id="mip-chat-ask-ai"
      type="button"
      onMouseDown={(e) => {
        // Don't let the click clear the selection before we read it.
        e.preventDefault();
      }}
      onClick={() => {
        const text = textRef.current;
        if (!text) return;
        const prompt = `Explain: "${text}"`;
        window.dispatchEvent(
          new CustomEvent("mip-chat:prefill", { detail: { text: prompt } }),
        );
        window.getSelection()?.removeAllRanges();
        setPos(null);
      }}
      className="fixed z-50 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-surface)] shadow-lg shadow-black/20 transition hover:opacity-90"
      style={{ left: pos.left, top: pos.top }}
    >
      <Sparkles className="h-3 w-3" />
      Ask AI
    </button>
  );
}
