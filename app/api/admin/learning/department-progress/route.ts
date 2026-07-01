import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningAdminService } from "@/services/learning-admin.service";

const VIEW_PERMS = [
  Permission.LEARNING_PROGRESS_VIEW,
  Permission.COURSES_MANAGE,
];

export const GET = withAnyPermission(VIEW_PERMS, async () => {
  return apiSuccess(await learningAdminService.getDepartmentProgress());
});
