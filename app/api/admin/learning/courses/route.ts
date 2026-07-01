import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { adminCourseListQuerySchema } from "@/lib/validations/learning-admin";
import { learningAdminService } from "@/services/learning-admin.service";

const VIEW_PERMS = [
  Permission.LEARNING_COURSES_VIEW,
  Permission.LEARNING_COURSES_MANAGE,
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.COURSES_MANAGE,
];

export const GET = withAnyPermission(VIEW_PERMS, async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = adminCourseListQuerySchema.parse(params);
  return apiSuccess(await learningAdminService.listCourses(query));
});
