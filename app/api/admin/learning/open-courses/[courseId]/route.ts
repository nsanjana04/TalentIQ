import { NextRequest } from "next/server";
import { apiSuccess, withLearningManager } from "@/lib/api/with-auth";
import { updateOpenCourseSchema } from "@/lib/validations/learning-content";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withLearningManager(async (req, session) => {
    const { courseId } = await context.params;
    const body = updateOpenCourseSchema.parse(await req.json());
    return apiSuccess(
      await learningContentService.updateOpenCourse(courseId, body, session.userId, session.role)
    );
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withLearningManager(async (_req, session) => {
    const { courseId } = await context.params;
    return apiSuccess(await learningContentService.deleteOpenCourse(courseId, session.userId));
  });
  return handler(_request);
}
