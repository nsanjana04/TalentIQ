import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { analyticsFilterSchema } from "@/lib/validations/analytics-hub";
import { analyticsHubService } from "@/services/analytics-hub.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (request: NextRequest, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = analyticsFilterSchema.parse(params);
  return apiSuccess(await analyticsHubService.getTeams(session.userId, session.role, query));
});
