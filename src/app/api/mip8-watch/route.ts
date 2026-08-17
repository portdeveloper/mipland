import {
  makeProbeBatch,
  parseProbeBatch,
  type Mip8ScheduleStatus,
} from "@/lib/mip8-watch";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 30_000;
const RPC_TIMEOUT_MS = 8_000;

const NETWORKS = [
  {
    id: "mainnet",
    name: "Mainnet",
    chainId: 143,
    rpcUrl: process.env.MONAD_MAINNET_RPC_URL ?? "https://rpc.monad.xyz",
  },
  {
    id: "testnet",
    name: "Testnet",
    chainId: 10_143,
    rpcUrl:
      process.env.MONAD_TESTNET_RPC_URL ?? "https://testnet-rpc.monad.xyz",
  },
] as const;

type NetworkId = (typeof NETWORKS)[number]["id"];

interface NetworkResult {
  id: NetworkId;
  name: string;
  chainId: number;
  blockNumber: number | null;
  contiguousGas: number | null;
  scatteredGas: number | null;
  status: Mip8ScheduleStatus | "unavailable";
}

interface WatchResponse {
  checkedAt: string;
  networks: NetworkResult[];
}

let cached: { expiresAt: number; value: WatchResponse } | null = null;
let pending: Promise<WatchResponse> | null = null;

async function probeNetwork(network: (typeof NETWORKS)[number]): Promise<NetworkResult> {
  try {
    const response = await fetch(network.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(makeProbeBatch()),
      cache: "no-store",
      signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`RPC responded with HTTP ${response.status}`);
    }

    const measurement = parseProbeBatch(await response.json());
    return {
      id: network.id,
      name: network.name,
      chainId: network.chainId,
      ...measurement,
    };
  } catch (error) {
    console.error(`MIP-8 probe failed for ${network.id}`, error);
    return {
      id: network.id,
      name: network.name,
      chainId: network.chainId,
      blockNumber: null,
      contiguousGas: null,
      scatteredGas: null,
      status: "unavailable",
    };
  }
}

async function loadWatchResponse(): Promise<WatchResponse> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  if (pending) {
    return pending;
  }

  pending = (async () => {
    const networks = await Promise.all(NETWORKS.map(probeNetwork));
    const value = { checkedAt: new Date().toISOString(), networks };
    cached = { expiresAt: Date.now() + CACHE_TTL_MS, value };
    return value;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

export async function GET() {
  return Response.json(await loadWatchResponse(), {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=120",
    },
  });
}
