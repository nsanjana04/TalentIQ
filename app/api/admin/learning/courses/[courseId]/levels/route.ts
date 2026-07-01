import { NextRequest } from "next/server";
import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningAdminService } from "@/services/learning-admin.service";

const VIEW_PERMS = [
  Permission.LEARNING_COURSES_VIEW,
  Permission.LEARNING_COURSES_MANAGE,
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.COURSES_MANAGE,
];

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(VIEW_PERMS, async () => {
    const { courseId } = await context.params;
    return apiSuccess(await learningAdminService.getCourseLevels(courseId));
  });
  return handler(_request);
}
