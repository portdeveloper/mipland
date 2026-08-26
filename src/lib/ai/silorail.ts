import "server-only";

import {
  BudgetExceededError,
  PaymentRejectedError,
  SiloRail,
  type ChatMessage,
} from "@silorail/sdk";
import type {
  FinishReason,
  ModelMessage,
  UIMessage,
  UIMessageStreamWriter,
} from "ai";

export const DEFAULT_SILORAIL_GATEWAY_URL = "https://testnet.silorail.com";
export const DEFAULT_SILORAIL_MODEL = "google/gemma-4-31b-it:free";

let client: SiloRail | null = null;

export function getSiloRailClient(): SiloRail {
  client ??= new SiloRail({
    gatewayUrl:
      process.env.SILORAIL_GATEWAY_URL?.trim() ||
      DEFAULT_SILORAIL_GATEWAY_URL,
    budget: {
      perCallMaxMicroUsd: readMicroUsdEnv("SILORAIL_PER_CALL_MAX_MICRO_USD"),
      sessionMaxMicroUsd: readMicroUsdEnv("SILORAIL_SESSION_MAX_MICRO_USD"),
    },
  });

  return client;
}

export function toSiloRailMessages(messages: ModelMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: contentToText(message.content),
  }));
}

export function silorailErrorResponse(error: unknown): Response {
  if (error instanceof BudgetExceededError) {
    return Response.json({ error: error.message }, { status: 402 });
  }

  if (error instanceof PaymentRejectedError) {
    return Response.json(
      { error: cleanSiloRailError(error.reason) },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error
      ? cleanSiloRailError(error.message)
      : "SiloRail chat request failed.";

  return Response.json({ error: message }, { status: 502 });
}

export async function openAIStreamToUIMessageStream(
  response: Response,
  writer: UIMessageStreamWriter<UIMessage>,
): Promise<void> {
  const body = response.body;
  if (!body) throw new Error("SiloRail response did not include a stream.");

  const textId = "silorail-text";
  let finishReason: FinishReason = "other";

  writer.write({ type: "start-step" });
  writer.write({ type: "text-start", id: textId });

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const nextFinishReason = writeOpenAIFrame(frame, writer, textId);
      if (nextFinishReason) finishReason = nextFinishReason;
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    const nextFinishReason = writeOpenAIFrame(buffer, writer, textId);
    if (nextFinishReason) finishReason = nextFinishReason;
  }

  writer.write({ type: "text-end", id: textId });
  writer.write({ type: "finish-step" });
  writer.write({ type: "finish", finishReason });
}

export async function responseToError(response: Response): Promise<Response> {
  const body = await response.text();
  const message = cleanSiloRailError(body || response.statusText);
  return Response.json({ error: message }, { status: response.status });
}

function readMicroUsdEnv(name: string): bigint | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) return undefined;

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${name} must be an integer number of micro-USDC.`);
  }

  return BigInt(raw);
}

function contentToText(content: ModelMessage["content"]): string | null {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => {
      if (part.type === "text") return part.text;
      return "";
    })
    .filter(Boolean)
    .join("\n");

  return text || null;
}

function writeOpenAIFrame(
  frame: string,
  writer: UIMessageStreamWriter<UIMessage>,
  textId: string,
): FinishReason | undefined {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data || data === "[DONE]") return undefined;

  const parsed = JSON.parse(data) as {
    error?: { message?: string } | string;
    choices?: Array<{
      delta?: { content?: unknown };
      finish_reason?: unknown;
    }>;
  };

  if (parsed.error) {
    const message =
      typeof parsed.error === "string"
        ? parsed.error
        : (parsed.error.message ?? "SiloRail stream failed.");
    throw new Error(cleanSiloRailError(message));
  }

  let finishReason: FinishReason | undefined;

  for (const choice of parsed.choices ?? []) {
    const content = choice.delta?.content;
    if (typeof content === "string" && content.length > 0) {
      writer.write({ type: "text-delta", id: textId, delta: content });
    }

    if (typeof choice.finish_reason === "string") {
      finishReason = toFinishReason(choice.finish_reason);
    }
  }

  return finishReason;
}

function toFinishReason(reason: string): FinishReason {
  switch (reason) {
    case "stop":
    case "length":
      return reason;
    case "content_filter":
      return "content-filter";
    case "tool_calls":
      return "tool-calls";
    default:
      return "other";
  }
}

function cleanSiloRailError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: string | { message?: string; code?: string };
    };
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // Plain text from the gateway or SDK.
  }

  return raw.trim() || "SiloRail chat request failed.";
}
