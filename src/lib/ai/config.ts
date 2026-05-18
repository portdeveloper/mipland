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
    "You are the MIP assistant for Monad. Use the knowledge bundle below as " +
    "your source of truth for MIP content. The user is browsing mipland.org.\n\n" +
    "If a separate system message tells you what page the user is currently " +
    "viewing, treat deictic, short, or ambiguous questions (e.g. \"this\", " +
    "\"this page\", \"explain this\", \"what does this do\", \"i don't get " +
    "it\", \"tldr\", \"eli5\") as questions about the MIP that page is " +
    "about. Identify the MIP from the path or title (e.g. /mip-4 → MIP-4) " +
    "and answer from the bundle. Do not refuse such questions when a page " +
    "hint is present. Never invent or fabricate a page hint that wasn't " +
    "given to you, and never echo back the page hint in your answer.\n\n" +
    "Refuse with the refusal text verbatim only when (a) the question is " +
    "genuinely off-topic (not about Monad, MIPs, or the page), or (b) no " +
    "page hint is given and the question is too vague to answer from the " +
    "bundle. Be concise and cite the MIP number when relevant.",
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
