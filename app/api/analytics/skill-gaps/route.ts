import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { skillGapsQuerySchema } from "@/lib/validations/analytics-hub";
import { analyticsHubService } from "@/services/analytics-hub.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (request: NextRequest, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = skillGapsQuerySchema.parse(params);
  return apiSuccess(await analyticsHubService.getSkillGaps(session.userId, session.role, query));
});
