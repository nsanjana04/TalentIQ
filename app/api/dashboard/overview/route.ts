import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { dashboardService } from "@/services/dashboard.service";

export const GET = withPermission(Permission.DASHBOARD_VIEW, async (_request, session) => {
  const overview = await dashboardService.getOverview(session.userId, session.role);
  return apiSuccess(overview);
});
