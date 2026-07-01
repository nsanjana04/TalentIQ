import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { userService } from "@/services/user.service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.USERS_DELETE, async (_req, session) => {
    const { userId } = await context.params;
    await userService.deactivate(userId, session.userId);
    return apiSuccess({ success: true });
  });
  return handler(request);
}
