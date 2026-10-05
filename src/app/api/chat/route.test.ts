import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type SentRequest = { messages: { role: string; content: string }[] };
const sent = vi.hoisted(() => ({ requests: [] as SentRequest[] }));
const configMock = vi.hoisted(() => vi.fn());
const knowledgeMock = vi.hoisted(() => vi.fn());

vi.mock("botid/server", () => ({ checkBotId: async () => ({ isBot: false }) }));
vi.mock("@/lib/ai/ratelimit", () => ({
  checkRateLimit: async () => ({ success: true, reset: 0 }),
  getClientIp: () => "127.0.0.1",
}));
vi.mock("@/lib/ai/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/config")>()),
  getChatConfig: configMock,
}));
vi.mock("@/lib/ai/knowledge", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ai/knowledge")>();
  knowledgeMock.mockImplementation(real.getKnowledgeBundle);
  return { getKnowledgeBundle: knowledgeMock };
});
// The provider is mocked; the request it would have received is captured.
vi.mock("@/lib/ai/silorail", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/silorail")>()),
  getSiloRailClient: () => ({
    request: async (body: SentRequest) => {
      sent.requests.push(body);
      return { response: new Response("upstream unavailable in tests", { status: 503 }) };
    },
  }),
}));

import { DEFAULT_CONFIG } from "@/lib/ai/config";
import { EVIDENCE_RULE } from "@/lib/ai/instructions";
import { POST } from "./route";

async function systemPromptFor(question: string): Promise<string> {
  sent.requests = [];
  await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ id: "1", role: "user", parts: [{ type: "text", text: question }] }],
      }),
    }),
  );
  const request = sent.requests.at(-1);
  if (!request) throw new Error("no request reached the provider");
  const system = request.messages.find((message) => message.role === "system");
  if (!system) throw new Error("no system message in the outgoing request");
  return system.content;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-05T03:00:00Z"));
  configMock.mockResolvedValue(DEFAULT_CONFIG);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("chat request evidence", () => {
  it("sends a Final MIP's separately sourced activation and the dated rule", async () => {
    const system = await systemPromptFor("Is MIP-8 live on mainnet?");

    expect(system).toContain("**Proposal status:** Final");
    expect(system).toContain("Activated with the MONAD_TEN upgrade on Monad mainnet");
    expect(system).toContain("https://docs.monad.xyz/developer-essentials/changelog/releases#v0-16-1");
    expect(system).toContain(
      "https://github.com/monad-crypto/MIPs/blob/b49e9034087924cf208266e6be9cb910457fcf9c/MIPs/MIP-8.md",
    );
    expect(system).toContain("**Verified:** October 4, 2026");
    expect(system).toContain(EVIDENCE_RULE);
    // Today's date travels separately from the content verification date.
    expect(system).toContain("Current date (UTC): 2026-10-05");
  });

  it("keeps the rule for a Final MIP with no activation evidence", async () => {
    knowledgeMock.mockResolvedValueOnce(
      [
        "# MIP-99: Example",
        "**Proposal status:** Final",
        "**Network status:** No activation evidence in this bundle.",
        "**Verified:** October 1, 2026, against the [canonical MIP-99 specification](https://example.org/MIP-99.md).",
      ].join("\n\n"),
    );
    const system = await systemPromptFor("Is MIP-99 active?");

    expect(system).toContain("No activation evidence in this bundle.");
    expect(system).toContain("https://example.org/MIP-99.md");
    expect(system).toContain("A Final specification does not by itself mean the change is live");
    expect(system).toContain("say the bundle cannot confirm activation and link the canonical specification");
    expect(system).toContain("Current date (UTC): 2026-10-05");
  });

  it("keeps the rule after a custom admin prompt", async () => {
    configMock.mockResolvedValueOnce({ ...DEFAULT_CONFIG, systemPrompt: "Custom admin prompt." });
    const system = await systemPromptFor("What is MIP-12?");

    expect(system.startsWith("Custom admin prompt.")).toBe(true);
    expect(system).not.toContain("You are the MIP assistant for Monad.");
    expect(system.indexOf(EVIDENCE_RULE)).toBeGreaterThan(system.indexOf("Custom admin prompt."));
    expect(system).toContain("Current date (UTC): 2026-10-05");
  });
});
