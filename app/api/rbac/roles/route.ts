import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { RBAC_ADMIN_PERMISSIONS } from "@/lib/rbac/permissions";
import { rbacService } from "@/services/rbac.service";

export const GET = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async () => {
  const roles = await rbacService.getAllRoles();
  return apiSuccess(roles);
});
