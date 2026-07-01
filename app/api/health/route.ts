import { apiSuccess } from "@/lib/errors/api-error";
import { prisma } from "@/lib/db/prisma";
import { checkRedisHealth } from "@/lib/cache/redis";

export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const redis = await checkRedisHealth();
  const healthy = database === "connected";

  return apiSuccess(
    {
      status: healthy ? "ok" : "degraded",
      service: "TalentIQ",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: { database, redis },
    },
    healthy ? 200 : 503
  );
}
