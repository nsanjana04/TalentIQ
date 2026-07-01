import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { successionModuleService } from "@/services/succession-module.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (_request, session) => {
  const [plans, summary] = await Promise.all([
    successionModuleService.getPlans(session.userId, session.role),
    successionModuleService.getSummary(session.userId, session.role),
  ]);
  return apiSuccess({ plans, summary });
});
