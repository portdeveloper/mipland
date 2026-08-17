export const MIP8_PROBE_BYTECODE = {
  contiguous:
    "0x5a60005450600154506002545060035450600454506005545060065450600754505a900360005260206000f3",
  scattered:
    "0x5a60005450608054506101005450610180545061020054506102805450610300545061038054505a900360005260206000f3",
} as const;

export type Mip8ScheduleStatus = "active" | "inactive" | "unknown";

export interface ProbeMeasurement {
  blockNumber: number;
  contiguousGas: number;
  scatteredGas: number;
  status: Mip8ScheduleStatus;
}

interface JsonRpcResponse {
  id?: unknown;
  result?: unknown;
  error?: unknown;
}

const ACTIVE_CONTIGUOUS_MAX = 12_000;
const COLD_READ_TOTAL_MIN = 50_000;
const EQUAL_SCHEDULE_TOLERANCE = 500;

export function classifyMip8Schedule(
  contiguousGas: number,
  scatteredGas: number
): Mip8ScheduleStatus {
  if (
    contiguousGas <= ACTIVE_CONTIGUOUS_MAX &&
    scatteredGas >= COLD_READ_TOTAL_MIN &&
    scatteredGas >= contiguousGas * 4
  ) {
    return "active";
  }

  if (
    contiguousGas >= COLD_READ_TOTAL_MIN &&
    Math.abs(contiguousGas - scatteredGas) <= EQUAL_SCHEDULE_TOLERANCE
  ) {
    return "inactive";
  }

  return "unknown";
}

function parseRpcQuantity(value: unknown, label: string): number {
  if (typeof value !== "string" || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error(`Invalid ${label} returned by RPC`);
  }

  const parsed = BigInt(value);
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds the safe integer range`);
  }

  return Number(parsed);
}

export function parseProbeBatch(payload: unknown): ProbeMeasurement {
  if (!Array.isArray(payload)) {
    throw new Error("RPC returned a non-batch response");
  }

  const responses = new Map<number, JsonRpcResponse>();
  for (const candidate of payload) {
    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "id" in candidate &&
      typeof candidate.id === "number"
    ) {
      responses.set(candidate.id, candidate as JsonRpcResponse);
    }
  }

  const resultFor = (id: number, label: string) => {
    const response = responses.get(id);
    if (!response || response.error !== undefined) {
      throw new Error(`RPC failed to return ${label}`);
    }
    return response.result;
  };

  const blockNumber = parseRpcQuantity(resultFor(1, "block number"), "block number");
  const contiguousGas = parseRpcQuantity(
    resultFor(2, "contiguous probe"),
    "contiguous gas"
  );
  const scatteredGas = parseRpcQuantity(
    resultFor(3, "scattered probe"),
    "scattered gas"
  );

  return {
    blockNumber,
    contiguousGas,
    scatteredGas,
    status: classifyMip8Schedule(contiguousGas, scatteredGas),
  };
}

export function makeProbeBatch() {
  return [
    { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_call",
      params: [{ data: MIP8_PROBE_BYTECODE.contiguous }, "latest"],
    },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "eth_call",
      params: [{ data: MIP8_PROBE_BYTECODE.scattered }, "latest"],
    },
  ];
}
