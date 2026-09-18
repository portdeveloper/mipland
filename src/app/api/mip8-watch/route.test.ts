import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MAINNET_URL = "https://rpc.monad.xyz";
const TESTNET_URL = "https://testnet-rpc.monad.xyz";

const batchFor = (chainIdHex: string) => [
  { jsonrpc: "2.0", id: 1, result: "0x33cdac5" },
  { jsonrpc: "2.0", id: 2, result: "0x228a" },
  { jsonrpc: "2.0", id: 3, result: "0xfd4a" },
  { jsonrpc: "2.0", id: 4, result: chainIdHex },
];

const jsonResponse = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

/**
 * Loads the route with a fresh module registry, because it keeps its cache in module scope and a
 * value cached by one test would answer the next one.
 */
const loadRoute = async () => {
  vi.resetModules();
  return import("./route");
};

const readNetworks = async (response: Response) => {
  const body = (await response.json()) as {
    networks: { id: string; status: string; contiguousGas: number | null }[];
  };
  return new Map(body.networks.map((network) => [network.id, network]));
};

describe("GET /api/mip8-watch", () => {
  beforeEach(() => {
    // The route logs the reason it gave up, which is wanted in production and noise here.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("publishes measurements when each endpoint is the chain it was configured as", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        jsonResponse(batchFor(url === TESTNET_URL ? "0x279f" : "0x8f"))
      )
    );

    const { GET } = await loadRoute();
    const networks = await readNetworks(await GET());

    expect(networks.get("mainnet")?.status).toBe("active");
    expect(networks.get("testnet")?.status).toBe("active");
  });

  // The reported bug, end to end: MONAD_TESTNET_RPC_URL pointing at a mainnet endpoint. The
  // testnet row must refuse to carry those numbers, and the mainnet row must be unaffected,
  // because one misconfigured endpoint is not a reason to lose the other network's result.
  it("marks only the mismatched network unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(batchFor("0x8f")))
    );

    const { GET } = await loadRoute();
    const networks = await readNetworks(await GET());

    expect(networks.get("testnet")?.status).toBe("unavailable");
    expect(networks.get("testnet")?.contiguousGas).toBeNull();
    expect(networks.get("mainnet")?.status).toBe("active");
    expect(networks.get("mainnet")?.contiguousGas).toBe(8_842);
  });

  it("keeps asking every endpoint which chain it is", async () => {
    const sentMethods = new Map<string, string[]>();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const batch = JSON.parse(String(init?.body)) as { method: string }[];
        sentMethods.set(
          url,
          batch.map((entry) => entry.method)
        );
        return jsonResponse(batchFor(url === TESTNET_URL ? "0x279f" : "0x8f"));
      })
    );

    const { GET } = await loadRoute();
    await GET();

    expect(sentMethods.get(MAINNET_URL)).toContain("eth_chainId");
    expect(sentMethods.get(TESTNET_URL)).toContain("eth_chainId");
  });
});
