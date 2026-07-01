import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { adminOverviewService } from "@/services/admin-overview.service";

export const GET = withPermission(Permission.USERS_VIEW, async () => {
  return apiSuccess(await adminOverviewService.getOverview());
});
