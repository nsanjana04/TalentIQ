import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { RBAC_ADMIN_PERMISSIONS } from "@/lib/rbac/permissions";
import { settingsService } from "@/services/settings.service";

export const GET = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async () => {
  return apiSuccess(await settingsService.getRoleSummaries());
});
