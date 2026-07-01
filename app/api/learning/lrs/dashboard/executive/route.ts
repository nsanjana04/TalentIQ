import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { lrsService } from "@/services/lrs.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (_request: NextRequest, session) => {
  const dashboard = await lrsService.getExecutiveDashboard(session.userId, session.role);
  return apiSuccess(dashboard);
});
