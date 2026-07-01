import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { userService } from "@/services/user.service";

export const GET = withPermission(Permission.USERS_VIEW, async () => {
  const meta = await userService.getFiltersMeta();
  return apiSuccess(meta);
});
