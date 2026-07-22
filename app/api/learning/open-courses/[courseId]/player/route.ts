import { NextRequest } from "next/server";
import { isLearningManagerRole } from "@/constants/learning-manager-roles";
import { apiSuccess, withPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { courseId } = await context.params;
    const adminCatalog =
      session.permissions.includes(Permission.COURSES_MANAGE) &&
      isLearningManagerRole(session.role);

    return apiSuccess(
      await learningContentService.getOpenCoursePlayer(courseId, session.userId, {
        adminCatalog,
      })
    );
  });

  return handler(request);
}
