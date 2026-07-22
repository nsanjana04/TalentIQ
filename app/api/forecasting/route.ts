import { NextRequest } from "next/server";
import type { ForecastModelType } from "@prisma/client";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { forecastingService } from "@/services/forecasting.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (request: NextRequest, session) => {
  const modelType = request.nextUrl.searchParams.get("model") as ForecastModelType | null;
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  if (refresh) {
    return apiSuccess(await forecastingService.generateForecasts(session.userId, session.role));
  }

  return apiSuccess(
    await forecastingService.getLatest(
      session.userId,
      session.role,
      modelType ?? undefined
    )
  );
});

export const POST = withPermission(Permission.ANALYTICS_VIEW, async (_request, session) => {
  return apiSuccess(await forecastingService.generateForecasts(session.userId, session.role));
});
