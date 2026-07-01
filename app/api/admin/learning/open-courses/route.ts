import { NextRequest } from "next/server";
import { apiSuccess, withLearningManager } from "@/lib/api/with-auth";
import { createOpenCourseSchema, openCourseListQuerySchema } from "@/lib/validations/learning-content";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withLearningManager(async (request: NextRequest) => {
  const query = openCourseListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  return apiSuccess(await learningContentService.listOpenCourses(query));
});

export const POST = withLearningManager(async (request: NextRequest, session) => {
  const body = createOpenCourseSchema.parse(await request.json());
  return apiSuccess(
    await learningContentService.createOpenCourse(body, session.userId, session.role)
  );
});
