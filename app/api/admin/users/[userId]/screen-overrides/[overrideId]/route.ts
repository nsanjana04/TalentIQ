import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { screenAccessService } from "@/services/screen-access.service";

type RouteContext = { params: Promise<{ userId: string; overrideId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.RBAC_MANAGE, Permission.USERS_VIEW],
    async (_req, session) => {
      const { overrideId } = await context.params;
      await screenAccessService.removeUserOverrideById(session.userId, overrideId);
      return apiSuccess({ removed: true });
    }
  );
  return handler(_request);
}
