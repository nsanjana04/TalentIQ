/** In-memory rate limiting for Edge middleware (no Redis/ioredis). */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

/** Rate limits are enforced in production; disabled in development unless opted in. */
export function isRateLimitEnabled(): boolean {
  if (process.env.RATE_LIMIT_ENABLED === "true") return true;
  if (process.env.RATE_LIMIT_ENABLED === "false") return false;
  return process.env.NODE_ENV === "production";
}

export interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function peekRateLimitEdge(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(config.key);

  if (!existing || now >= existing.resetAt) {
    return { allowed: true, remaining: config.limit, resetAt: now + config.windowMs };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function checkRateLimitEdge(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(config.key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + config.windowMs;
    memoryStore.set(config.key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function peekRateLimitEdgeOnly(config: RateLimitConfig): RateLimitResult {
  return peekRateLimitEdge(config);
}

export function getClientRateLimitKey(ip: string, route: string): string {
  return `${ip}:${route}`;
}

export const RATE_LIMITS = {
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  api: { limit: 120, windowMs: 60 * 1000 },
  auth: { limit: 60, windowMs: 15 * 60 * 1000 },
} as const;
