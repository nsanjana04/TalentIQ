import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { settingsService } from "@/services/settings.service";

export const GET = withPermission(Permission.SETTINGS_MANAGE, async () => {
  return apiSuccess(await settingsService.getOverview());
});
