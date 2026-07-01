import { AppError } from "@/lib/errors/app-error";
import {
  checkRateLimitEdge,
  isRateLimitEnabled,
  peekRateLimitEdgeOnly,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit-edge";

export type { RateLimitConfig, RateLimitResult };
export { getClientRateLimitKey, isRateLimitEnabled, RATE_LIMITS } from "./rate-limit-edge";

async function peekRedisRateLimit(config: RateLimitConfig): Promise<RateLimitResult | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const { getRedisClient } = await import("@/lib/cache/redis");
    const redis = await getRedisClient();
    if (!redis) return null;

    const redisKey = `ratelimit:${config.key}`;
    const raw = await redis.get(redisKey);
    const count = raw ? Number.parseInt(raw, 10) : 0;
    const ttl = await redis.pttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl : config.windowMs);

    if (count >= config.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining: config.limit - count, resetAt };
  } catch {
    return null;
  }
}

async function checkRedisRateLimit(config: RateLimitConfig): Promise<RateLimitResult | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const { getRedisClient } = await import("@/lib/cache/redis");
    const redis = await getRedisClient();
    if (!redis) return null;

    const redisKey = `ratelimit:${config.key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.pexpire(redisKey, config.windowMs);
    }

    const ttl = await redis.pttl(redisKey);
    const resetAt = Date.now() + (ttl > 0 ? ttl : config.windowMs);

    if (count > config.limit) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return { allowed: true, remaining: config.limit - count, resetAt };
  } catch {
    return null;
  }
}

/** Read-only check — does not increment the counter. */
export async function peekRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) {
    return { allowed: true, remaining: config.limit, resetAt: Date.now() + config.windowMs };
  }

  const redisResult = await peekRedisRateLimit(config);
  if (redisResult) return redisResult;
  return peekRateLimitEdgeOnly(config);
}

/** Server-side rate limit with Redis fallback to memory */
export async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) {
    return { allowed: true, remaining: config.limit, resetAt: Date.now() + config.windowMs };
  }

  const redisResult = await checkRedisRateLimit(config);
  if (redisResult) return redisResult;
  return checkRateLimitEdge(config);
}

export async function enforceRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) {
    return { allowed: true, remaining: config.limit, resetAt: Date.now() + config.windowMs };
  }

  const result = await checkRateLimit(config);
  if (!result.allowed) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", {
      details: { resetAt: result.resetAt },
    });
  }
  return result;
}

export async function assertNotRateLimited(config: RateLimitConfig): Promise<void> {
  const result = await peekRateLimit(config);
  if (!result.allowed) {
    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", {
      details: { resetAt: result.resetAt },
    });
  }
}

/** Record a failed attempt (e.g. bad password) and enforce the limit. */
export async function recordFailedAttempt(config: RateLimitConfig): Promise<void> {
  await enforceRateLimit(config);
}
