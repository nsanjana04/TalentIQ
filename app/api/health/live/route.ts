import { apiSuccess } from "@/lib/errors/api-error";

/** Liveness probe — process is running */
export async function GET() {
  return apiSuccess({
    status: "alive",
    service: "TalentIQ",
    timestamp: new Date().toISOString(),
  });
}
