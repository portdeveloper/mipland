"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X } from "lucide-react";
import { useState } from "react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

export default function MipChat() {
  const [open, setOpen] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <>
      {/* Floating panel — anchored to the same corner as the pill, no backdrop,
          page underneath stays scrollable and interactive. */}
      <div
        aria-hidden={!open}
        className={`fixed bottom-24 right-6 z-50 flex w-[calc(100vw-3rem)] max-w-[380px] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-2xl shadow-black/10 transition-all duration-200 ease-out sm:max-w-[400px] ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
        style={{ height: "min(600px, calc(100vh - 8rem))" }}
        role="dialog"
        aria-labelledby="mip-chat-title"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-3">
          <div className="flex flex-col">
            <h2
              id="mip-chat-title"
              className="text-sm font-semibold text-[var(--color-text-primary)]"
            >
              MIP Assistant
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Answers from the MIP knowledge base.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close MIP assistant"
            className="-mr-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                title="Ask about MIPs"
                description="Try: “What does MIP-8 change?” or “Compare MIP-3 and MIP-4.”"
                icon={<MessageCircle className="h-6 w-6" />}
              />
            ) : (
              messages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((m) => (
                  <Message key={m.id} from={m.role as "user" | "assistant"}>
                    <MessageContent>
                      {m.parts.map((part, i) =>
                        part.type === "text" ? (
                          <MessageResponse key={i}>{part.text}</MessageResponse>
                        ) : null,
                      )}
                    </MessageContent>
                  </Message>
                ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
          <PromptInput
            onSubmit={async (msg) => {
              const text = msg.text.trim();
              if (!text) return;
              await sendMessage({ text });
            }}
          >
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask about a MIP..."
                className="min-h-10 py-2.5 text-sm leading-5"
              />
            </PromptInputBody>
            <PromptInputSubmit status={status} />
          </PromptInput>
        </div>
      </div>

      {/* Pill trigger — toggles open/closed. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close MIP assistant" : "Open MIP assistant"}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-[var(--color-solution-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-[var(--color-solution-accent)]/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-solution-accent)]"
      >
        {open ? (
          <>
            <X className="h-4 w-4" />
            Close
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" />
            Ask about MIPs
          </>
        )}
      </button>
    </>
  );
}
