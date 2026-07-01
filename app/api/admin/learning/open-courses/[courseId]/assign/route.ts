import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors/app-error";
import { apiSuccess, withLearningManager } from "@/lib/api/with-auth";
import { learningContentService } from "@/services/learning-content.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withLearningManager(async () => {
    const { courseId } = await context.params;
    return apiSuccess(await learningContentService.listOpenCourseAssignments(courseId));
  });
  return handler(_request);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withLearningManager(async () => {
    throw new AppError(
      "BAD_REQUEST",
      "Generic open-course assignment is disabled. Use Admin → Learning → Assignments to assign Course + Level + Audience + Due Date."
    );
  });
  return handler(request);
}
