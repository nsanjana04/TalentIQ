import { NextRequest } from "next/server";
import { isLearningManagerRole } from "@/constants/learning-manager-roles";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { courseId } = await context.params;
    const canManage =
      session.permissions.includes(Permission.COURSES_MANAGE) &&
      isLearningManagerRole(session.role);

    return apiSuccess(
      await learningContentService.completeOpenCourse(session.userId, courseId, {
        bypassAssignmentCheck: canManage,
      })
    );
  });
  return handler(_request);
}
