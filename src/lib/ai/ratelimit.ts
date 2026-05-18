import "server-only";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

// 10 tokens per 60s = 1 token every 6 seconds, burst cap of 10.
const CAPACITY = 10;
const REFILL_PER_MS = CAPACITY / 60_000;
const GC_AFTER_MS = 10 * 60_000;

type Bucket = { tokens: number; updatedAt: number };

// Module-level Map persists across requests on the same Fluid Compute
// instance. Each instance gets its own counter, so the effective limit is
// 10/min × N_instances. Acceptable at this traffic level — swap to a shared
// store (Upstash, Redis) if abuse becomes real.
const buckets = new Map<string, Bucket>();
let lastGc = 0;

function refill(b: Bucket, now: number): void {
  const elapsed = now - b.updatedAt;
  if (elapsed <= 0) return;
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_MS);
  b.updatedAt = now;
}

function gc(now: number): void {
  if (now - lastGc < GC_AFTER_MS) return;
  lastGc = now;
  for (const [ip, b] of buckets) {
    if (now - b.updatedAt > GC_AFTER_MS) buckets.delete(ip);
  }
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const now = Date.now();
  gc(now);

  let b = buckets.get(ip);
  if (!b) {
    b = { tokens: CAPACITY, updatedAt: now };
    buckets.set(ip, b);
  } else {
    refill(b, now);
  }

  if (b.tokens >= 1) {
    b.tokens -= 1;
    const msUntilFull = Math.ceil((CAPACITY - b.tokens) / REFILL_PER_MS);
    return { success: true, remaining: Math.floor(b.tokens), reset: now + msUntilFull };
  }

  const msUntilNext = Math.ceil((1 - b.tokens) / REFILL_PER_MS);
  return { success: false, remaining: 0, reset: now + msUntilNext };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "anonymous";
}
