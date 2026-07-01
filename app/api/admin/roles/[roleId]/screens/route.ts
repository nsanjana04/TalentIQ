import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { RBAC_ADMIN_PERMISSIONS } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";

type RouteContext = { params: Promise<{ roleId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async () => {
    const { roleId } = await context.params;
    const screens = await screenAccessService.getRoleScreens(roleId);
    return apiSuccess({ screens });
  });
  return handler(_request);
}
