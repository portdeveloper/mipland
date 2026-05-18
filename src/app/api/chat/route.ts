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

const PageContextSchema = z
  .object({
    path: z.string().max(200).optional(),
    title: z.string().max(300).optional(),
  })
  .optional();

const RequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
  pageContext: PageContextSchema,
});

type PageContext = z.infer<typeof PageContextSchema>;

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

  let parsed: { messages: UIMessage[]; pageContext: PageContext };
  try {
    const body = await req.json();
    const validated = RequestSchema.parse(body);
    parsed = {
      messages: validated.messages as UIMessage[],
      pageContext: validated.pageContext,
    };
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

  // Static prefix: instructions + knowledge bundle. Stable across requests
  // so the gateway's automatic caching can hit on the prefix.
  const systemMessages: ModelMessage[] = [
    {
      role: "system",
      content: `${instructions}\n\nKnowledge bundle:\n\n${knowledge}`,
    },
  ];

  // Dynamic suffix: where the user currently is in the app. Kept as a
  // separate system message after the cached prefix so it doesn't break
  // prefix caching when the user navigates between pages.
  if (parsed.pageContext?.path) {
    const { path, title } = parsed.pageContext;
    const line = `Current page the user is viewing: ${path}${
      title ? ` — "${title}"` : ""
    }`;
    systemMessages.push({ role: "system", content: line });
  }

  const result = streamText({
    model: config.model,
    messages: [...systemMessages, ...modelMessages],
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    providerOptions: {
      gateway: { caching: "auto" },
      deepseek: { thinking: { type: "disabled" } },
    },
  });

  return result.toUIMessageStreamResponse();
}
