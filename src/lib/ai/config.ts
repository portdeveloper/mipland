import "server-only";

import { get } from "@vercel/edge-config";

export type ChatConfig = {
  systemPrompt: string;
  model: string;
  allowedTopics: string[];
  refusalText: string;
  temperature: number;
  maxTokens: number;
};

export const DEFAULT_CONFIG: ChatConfig = {
  systemPrompt:
    "You are the MIP assistant for Monad. Answer only from the knowledge bundle " +
    "provided below. If a question is outside the allowed topics or cannot be " +
    "answered from the bundle, reply with the refusal text verbatim. Be concise " +
    "and cite the MIP number when relevant.",
  model: "deepseek/deepseek-v4-pro",
  allowedTopics: [
    "Monad Improvement Proposals (MIPs)",
    "the MIP process",
    "specific MIPs listed in the knowledge bundle",
  ],
  refusalText:
    "I can only answer questions about Monad Improvement Proposals. " +
    "Try asking about MIP-3, MIP-4, MIP-7, or MIP-8.",
  temperature: 0.2,
  maxTokens: 600,
};

const EDGE_CONFIG_KEY = "chat";

function isPartialChatConfig(value: unknown): value is Partial<ChatConfig> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function getChatConfig(): Promise<ChatConfig> {
  if (!process.env.EDGE_CONFIG) {
    return DEFAULT_CONFIG;
  }

  try {
    const stored = await get(EDGE_CONFIG_KEY);
    if (!isPartialChatConfig(stored)) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...stored };
  } catch {
    // Edge Config unreachable or key missing — fall back to defaults rather
    // than 500ing the chat.
    return DEFAULT_CONFIG;
  }
}
