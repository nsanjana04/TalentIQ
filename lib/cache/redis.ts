import type Redis from "ioredis";

let client: Redis | null = null;
let connectPromise: Promise<Redis | null> | null = null;

export async function getRedisClient(): Promise<Redis | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (client) return client;

  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const { default: IORedis } = await import("ioredis");
        const redis = new IORedis(url, {
          maxRetriesPerRequest: 2,
          lazyConnect: true,
          enableOfflineQueue: false,
        });
        await redis.connect();
        client = redis;
        return redis;
      } catch (err) {
        console.warn("[Redis] Connection failed, using in-memory fallback:", err);
        return null;
      }
    })();
  }

  return connectPromise;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silent fallback
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // silent fallback
  }
}

export async function checkRedisHealth(): Promise<"connected" | "disconnected" | "not_configured"> {
  if (!process.env.REDIS_URL) return "not_configured";
  const redis = await getRedisClient();
  if (!redis) return "disconnected";
  try {
    const pong = await redis.ping();
    return pong === "PONG" ? "connected" : "disconnected";
  } catch {
    return "disconnected";
  }
}
