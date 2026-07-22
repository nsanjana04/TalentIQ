import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import {
  generateAllModuleAssessmentsSchema,
  generateModuleAssessmentQuestionsSchema,
} from "@/lib/validations/course-admin";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { courseId } = await context.params;
    const body = generateAllModuleAssessmentsSchema.parse(await req.json().catch(() => ({})));
    const result = await courseQuizGeneratorService.generateAllModuleAssessments(
      courseId,
      session.userId,
      body
    );
    return apiSuccess(result);
  });
  return handler(request);
}
