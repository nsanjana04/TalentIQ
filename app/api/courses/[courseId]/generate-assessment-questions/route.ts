import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { generateCourseAssessmentQuestionsSchema } from "@/lib/validations/course-admin";
import { courseQuizGeneratorService } from "@/services/course-quiz-generator.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { courseId } = await context.params;
    const body = generateCourseAssessmentQuestionsSchema.parse(await req.json());
    const result = await courseQuizGeneratorService.generateForCourseAdmin(
      courseId,
      session.userId,
      body
    );
    return apiSuccess(result);
  });
  return handler(request);
}
