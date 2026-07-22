import { apiSuccess } from "@/lib/errors/api-error";
import { prisma } from "@/lib/db/prisma";
import { checkRedisHealth } from "@/lib/cache/redis";

/** Readiness probe — dependencies are available */
export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const redis = await checkRedisHealth();
  const ready = database === "connected";

  return apiSuccess(
    {
      status: ready ? "ready" : "not_ready",
      service: "TalentIQ",
      timestamp: new Date().toISOString(),
      checks: { database, redis },
    },
    ready ? 200 : 503
  );
}
