import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { isLlmEnabled } from "@/lib/ai/llm-client";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async () => {
    const { courseId } = await context.params;
    const assessments = await courseQuizGeneratorService.getLinkedAssessments(courseId);
    return apiSuccess({ assessments, aiEnabled: isLlmEnabled() });
  });
  return handler(_request);
}
