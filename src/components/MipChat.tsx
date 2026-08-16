"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const MipChatPanel = dynamic(() => import("./MipChatPanel"), { ssr: false });

export interface PendingChatQuestion {
  id: number;
  text: string;
}

export default function MipChat() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [pendingQuestion, setPendingQuestion] =
    useState<PendingChatQuestion | null>(null);
  const questionId = useRef(0);

  useEffect(() => {
    function handler(event: Event) {
      const text = (event as CustomEvent<{ text?: string }>).detail?.text?.trim();
      if (!text) return;

      questionId.current += 1;
      setPendingQuestion({ id: questionId.current, text });
      setHasOpened(true);
      setOpen(true);
    }

    window.addEventListener("mip-chat:ask", handler);
    return () => window.removeEventListener("mip-chat:ask", handler);
  }, []);

  function toggleChat() {
    setHasOpened(true);
    setOpen((current) => !current);
  }

  return (
    <>
      {hasOpened && (
        <MipChatPanel
          open={open}
          onClose={() => setOpen(false)}
          pendingQuestion={pendingQuestion}
        />
      )}

      <button
        type="button"
        onClick={toggleChat}
        aria-label={open ? "Close MIP assistant" : "Open MIP assistant"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[var(--color-solution-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-[var(--color-solution-accent)]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-solution-accent)]"
      >
        {open ? (
          <>
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Close
          </>
        ) : (
          <>
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
            </svg>
            Ask about MIPs
          </>
        )}
      </button>
    </>
  );
}
