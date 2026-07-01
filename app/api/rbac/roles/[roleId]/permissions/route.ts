import { NextRequest } from "next/server";
import { z } from "zod";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { RBAC_ADMIN_PERMISSIONS } from "@/lib/rbac/permissions";
import { rbacService } from "@/services/rbac.service";
import { getClientIp, getUserAgent } from "@/lib/utils";

const toggleSchema = z.object({
  permissionId: z.string().min(1),
  enabled: z.boolean(),
});

const bulkToggleSchema = z.object({
  toggles: z.array(toggleSchema).min(1),
});

type RouteContext = { params: Promise<{ roleId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async () => {
    const { roleId } = await context.params;
    const data = await rbacService.getRoleWithPermissions(roleId);
    return apiSuccess(data);
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async (req, session) => {
    const { roleId } = await context.params;
    const { toggles } = bulkToggleSchema.parse(await req.json());

    const data = await rbacService.bulkToggleRolePermissions(
      roleId,
      toggles,
      session.userId,
      { ipAddress: getClientIp(req), userAgent: getUserAgent(req) }
    );
    return apiSuccess(data);
  });
  return handler(request);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async (req, session) => {
    const { roleId } = await context.params;
    const body = toggleSchema.parse(await req.json());

    const data = await rbacService.toggleRolePermission(
      roleId,
      body.permissionId,
      body.enabled,
      session.userId,
      { ipAddress: getClientIp(req), userAgent: getUserAgent(req) }
    );
    return apiSuccess(data);
  });
  return handler(request);
}
