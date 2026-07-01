import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { courseLearningService } from "@/services/course-learning.service";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.COURSES_VIEW, Permission.COURSES_MANAGE],
    async (req, session) => {
      const { lessonId } = await context.params;
      const body = (await req.json().catch(() => ({}))) as { timeSpentMinutes?: number };
      const result = await courseLearningService.completeLesson(
        session.userId,
        lessonId,
        body.timeSpentMinutes
      );
      return apiSuccess(result);
    }
  );
  return handler(request);
}
