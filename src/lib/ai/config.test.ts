import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.hoisted(() => vi.fn());

vi.mock("@vercel/edge-config", () => ({
  get: getMock,
}));

async function loadConfig() {
  vi.resetModules();
  return import("./config");
}

describe("getChatConfig", () => {
  beforeEach(() => {
    getMock.mockReset();
    delete process.env.EDGE_CONFIG;
    delete process.env.SILORAIL_MODEL;
  });

  it("uses the SiloRail free router as the default model", async () => {
    const { DEFAULT_CONFIG } = await loadConfig();

    expect(DEFAULT_CONFIG.model).toBe("openrouter/free");
  });

  it("uses stored Edge Config values when no model env override is set", async () => {
    process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=x";
    getMock.mockResolvedValue({ model: "google/gemma-4-31b-it:free" });
    const { getChatConfig } = await loadConfig();

    await expect(getChatConfig()).resolves.toMatchObject({
      model: "google/gemma-4-31b-it:free",
    });
  });

  it("lets SILORAIL_MODEL override a stale Edge Config model", async () => {
    process.env.EDGE_CONFIG = "https://edge-config.vercel.com/ecfg_test?token=x";
    process.env.SILORAIL_MODEL = "openrouter/free";
    getMock.mockResolvedValue({ model: "google/gemma-4-31b-it:free" });
    const { getChatConfig } = await loadConfig();

    await expect(getChatConfig()).resolves.toMatchObject({
      model: "openrouter/free",
    });
  });
});
