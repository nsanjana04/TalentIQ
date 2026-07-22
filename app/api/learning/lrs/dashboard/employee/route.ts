import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { lrsService } from "@/services/lrs.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (_request: NextRequest, session) => {
  const dashboard = await lrsService.getEmployeeDashboard(session.userId);
  return apiSuccess(dashboard);
});
