import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningAdminService } from "@/services/learning-admin.service";
import { learningContentService } from "@/services/learning-content.service";
import type { AssignableUser } from "@/types/learning-admin";
import type { AssignableEmployeesResponse } from "@/types/learning-content";

const VIEW_PERMS = [
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.LEARNING_COURSES_VIEW,
  Permission.COURSES_MANAGE,
];

export const GET = withAnyPermission<AssignableEmployeesResponse | AssignableUser[]>(
  VIEW_PERMS,
  async (request, session) => {
    const format = request.nextUrl.searchParams.get("format");
    if (format !== "assignment") {
      return apiSuccess(
        await learningContentService.getAssignableEmployees(session.userId, session.role)
      );
    }

    const search = request.nextUrl.searchParams.get("search") ?? undefined;
    return apiSuccess(await learningAdminService.getAssignableUsers(search));
  }
);
