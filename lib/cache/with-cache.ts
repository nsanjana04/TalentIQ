import { cacheGet, cacheSet } from "@/lib/cache/redis";

/**
 * Redis-backed cache wrapper with in-memory bypass when Redis is unavailable.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
