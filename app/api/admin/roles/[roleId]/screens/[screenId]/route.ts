import { NextRequest } from "next/server";
import { z } from "zod";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { RBAC_ADMIN_PERMISSIONS } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";

type RouteContext = { params: Promise<{ roleId: string; screenId: string }> };

const patchSchema = z.object({
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(RBAC_ADMIN_PERMISSIONS, async (req, session) => {
      const { roleId, screenId } = await context.params;
      const body = patchSchema.parse(await req.json());
      const updated = await screenAccessService.patchRoleScreen(
        roleId,
        screenId,
        body.enabled,
        session.userId
      );
      return apiSuccess(updated);
  });
  return handler(request);
}
