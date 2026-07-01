import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createLessonSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { moduleId } = await context.params;
    const body = createLessonSchema.parse(await req.json());
    const lesson = await courseAdminService.createLesson(moduleId, body, session.userId);
    return apiSuccess(lesson);
  });
  return handler(request);
}
