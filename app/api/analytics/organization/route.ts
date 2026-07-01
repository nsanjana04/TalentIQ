import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { analyticsHubService } from "@/services/analytics-hub.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (_request, session) => {
  return apiSuccess(await analyticsHubService.getOrganization(session.userId, session.role));
});
