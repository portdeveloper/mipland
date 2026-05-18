import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

const ALLOW_ALL: RateLimitResult = {
  success: true,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
};

function hasUpstashEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (!hasUpstashEnv()) return null;
  limiter ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.tokenBucket(10, "60 s", 10),
    analytics: true,
    prefix: "mipland:chat",
  });
  return limiter;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getLimiter();
  if (!rl) return ALLOW_ALL;

  const { success, remaining, reset } = await rl.limit(ip);
  return { success, remaining, reset };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "anonymous";
}
