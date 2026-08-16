"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

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
import type { PendingChatQuestion } from "@/components/MipChat";

interface MipChatPanelProps {
  open: boolean;
  onClose: () => void;
  pendingQuestion: PendingChatQuestion | null;
}

function TypingDots() {
  return (
    <div
      role="status"
      aria-label="Assistant is typing"
      className="flex items-center gap-1 py-1"
    >
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:0ms] [animation-duration:1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:150ms] [animation-duration:1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:300ms] [animation-duration:1s]" />
    </div>
  );
}

export default function MipChatPanel({
  open,
  onClose,
  pendingQuestion,
}: MipChatPanelProps) {
  const pathname = usePathname();
  const lastQuestionId = useRef(0);
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );
  const { messages, sendMessage, status } = useChat({ transport });

  const pageContext = useCallback(() => {
    return {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
    };
  }, [pathname]);

  useEffect(() => {
    if (!pendingQuestion || pendingQuestion.id <= lastQuestionId.current) return;
    lastQuestionId.current = pendingQuestion.id;
    void sendMessage(
      { text: pendingQuestion.text },
      { body: { pageContext: pageContext() } },
    );
  }, [pageContext, pendingQuestion, sendMessage]);

  return (
    <div
      data-mip-chat="true"
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
          onClick={onClose}
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
              .filter((message) =>
                message.role === "user" || message.role === "assistant"
              )
              .map((message) => (
                <Message
                  key={message.id}
                  from={message.role as "user" | "assistant"}
                >
                  <MessageContent>
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <MessageResponse key={index}>{part.text}</MessageResponse>
                      ) : null,
                    )}
                  </MessageContent>
                </Message>
              ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <TypingDots />
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
        <PromptInput
          onSubmit={async (message) => {
            const text = message.text.trim();
            if (!text) return;
            await sendMessage(
              { text },
              { body: { pageContext: pageContext() } },
            );
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
  );
}
