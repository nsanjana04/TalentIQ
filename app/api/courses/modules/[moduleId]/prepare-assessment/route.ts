import { NextRequest } from "next/server";
import { withAnyPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { courseLearningService } from "@/services/course-learning.service";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(
    [Permission.COURSES_VIEW, Permission.COURSES_MANAGE],
    async (_req, session) => {
      const { moduleId } = await context.params;
      const result = await courseLearningService.prepareModuleAssessment(session.userId, moduleId);
      return apiSuccess(result);
    }
  );
  return handler(_request);
}
