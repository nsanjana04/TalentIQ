import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { enrollCourseSchema } from "@/lib/validations/learning-roadmap";
import { learningRoadmapService } from "@/services/learning-roadmap.service";

export const POST = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const body = enrollCourseSchema.parse(await request.json());
  const result = await learningRoadmapService.enrollInCourse(session.userId, body.courseId);
  return apiSuccess(result);
});
