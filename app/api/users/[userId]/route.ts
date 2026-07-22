import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateUserSchema } from "@/lib/validations/users";
import { userService } from "@/services/user.service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.USERS_VIEW, async () => {
    const { userId } = await context.params;
    const profile = await userService.getProfile(userId);
    return apiSuccess(profile);
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.USERS_UPDATE, async (req, session) => {
    const { userId } = await context.params;
    const body = await req.json();
    const input = updateUserSchema.parse(body);
    const user = await userService.update(userId, input, session.userId);
    return apiSuccess(user);
  });
  return handler(request);
}
