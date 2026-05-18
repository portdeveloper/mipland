"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type ChatConfig, DEFAULT_CONFIG } from "@/lib/ai/config";

const FormSchema = z.object({
  systemPrompt: z.string().min(1).max(8000),
  model: z.string().min(1).max(120),
  allowedTopics: z.string().max(2000),
  refusalText: z.string().min(1).max(2000),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(50).max(4000),
});

export type SaveResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

function extractEdgeConfigId(): string | null {
  // Prefer an explicit env var; otherwise parse the connection string,
  // which looks like https://edge-config.vercel.com/ecfg_abc?token=...
  if (process.env.EDGE_CONFIG_ID) return process.env.EDGE_CONFIG_ID;
  const conn = process.env.EDGE_CONFIG;
  if (!conn) return null;
  try {
    const url = new URL(conn);
    const id = url.pathname.replace(/^\//, "");
    return id || null;
  } catch {
    return null;
  }
}

export async function saveChatConfig(formData: FormData): Promise<SaveResult> {
  const parsed = FormSchema.safeParse({
    systemPrompt: formData.get("systemPrompt"),
    model: formData.get("model"),
    allowedTopics: formData.get("allowedTopics"),
    refusalText: formData.get("refusalText"),
    temperature: formData.get("temperature"),
    maxTokens: formData.get("maxTokens"),
  });
  if (!parsed.success) {
    return { ok: false, message: `Invalid form: ${parsed.error.message}` };
  }

  const next: ChatConfig = {
    ...DEFAULT_CONFIG,
    systemPrompt: parsed.data.systemPrompt,
    model: parsed.data.model,
    allowedTopics: parsed.data.allowedTopics
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    refusalText: parsed.data.refusalText,
    temperature: parsed.data.temperature,
    maxTokens: parsed.data.maxTokens,
  };

  const id = extractEdgeConfigId();
  const token = process.env.VERCEL_API_TOKEN;
  if (!id || !token) {
    return {
      ok: false,
      message:
        "Edge Config write skipped: set EDGE_CONFIG (or EDGE_CONFIG_ID) and VERCEL_API_TOKEN. " +
        "Form values validated successfully but were not saved.",
    };
  }

  const teamId = process.env.VERCEL_TEAM_ID;
  const url = new URL(`https://api.vercel.com/v1/edge-config/${id}/items`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ operation: "upsert", key: "chat", value: next }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      message: `Vercel API ${res.status}: ${body.slice(0, 300)}`,
    };
  }

  revalidatePath("/admin/chat");
  return { ok: true, message: "Saved." };
}
