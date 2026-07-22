import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { canAny } from "@/lib/rbac/check";
import { courseLearningService } from "@/services/course-learning.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.COURSES_VIEW, Permission.COURSES_MANAGE],
    async (_req, session) => {
      const { courseId } = await context.params;
      const lessonId = request.nextUrl.searchParams.get("lessonId");
      const player = await courseLearningService.getPlayer(
        session.userId,
        courseId,
        lessonId,
        {
          allowUnpublished: canAny(session.permissions, [Permission.COURSES_MANAGE]),
        }
      );
      return apiSuccess(player);
    }
  );
  return handler(request);
}
