import {
  convertToModelMessages,
  streamText,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { getChatConfig } from "@/lib/ai/config";
import { getKnowledgeBundle } from "@/lib/ai/knowledge";
import { checkRateLimit, getClientIp } from "@/lib/ai/ratelimit";

// Fluid Compute (Node.js runtime) — full streaming support, no edge limits.
export const maxDuration = 60;

const RequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
});

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(ip);
  if (!rl.success) {
    return Response.json(
      { error: "Too many requests. Try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
            .toString(),
        },
      },
    );
  }

  let parsed: { messages: UIMessage[] };
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);
    parsed = { messages: validated.messages as UIMessage[] };
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const [config, knowledge] = await Promise.all([
    getChatConfig(),
    getKnowledgeBundle(),
  ]);

  const allowedTopicsLine =
    config.allowedTopics.length > 0
      ? `Allowed topics: ${config.allowedTopics.join("; ")}.`
      : "";

  const instructions = [
    config.systemPrompt,
    allowedTopicsLine,
    `Refusal text (use verbatim when declining): "${config.refusalText}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const modelMessages = await convertToModelMessages(parsed.messages);

  // Combine instructions + knowledge into one system message and attach
  // ephemeral cacheControl to the whole thing. The system prompt is also
  // stable between admin edits, so caching it together is harmless.
  const systemMessage: ModelMessage = {
    role: "system",
    content: `${instructions}\n\nKnowledge bundle:\n\n${knowledge}`,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" } },
    },
  };

  const result = streamText({
    model: config.model,
    messages: [systemMessage, ...modelMessages],
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
  });

  return result.toUIMessageStreamResponse();
}
