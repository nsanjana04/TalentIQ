import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";

export const GET = withAnyPermission(
  [Permission.RBAC_MANAGE, Permission.ROLES_MANAGE],
  async () => {
    const screens = await screenAccessService.getAllScreens();
    return apiSuccess({ screens });
  }
);
