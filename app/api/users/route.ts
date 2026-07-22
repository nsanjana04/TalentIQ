import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createUserSchema, userListQuerySchema } from "@/lib/validations/users";
import { userService } from "@/services/user.service";

export const GET = withPermission(Permission.USERS_VIEW, async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = userListQuerySchema.parse(params);
  const result = await userService.list(query);
  return apiSuccess(result);
});

export const POST = withPermission(Permission.USERS_CREATE, async (request: NextRequest, session) => {
  const body = createUserSchema.parse(await request.json());
  const user = await userService.create(body, session.userId);
  return apiSuccess(user);
});
