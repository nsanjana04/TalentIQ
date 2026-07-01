import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { courseAdminService } from "@/services/course-admin.service";

export const GET = withPermission(Permission.COURSES_MANAGE, async () => {
  return apiSuccess(await courseAdminService.getMeta());
});
