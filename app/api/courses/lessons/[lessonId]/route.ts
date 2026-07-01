import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateLessonSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { lessonId } = await context.params;
    const body = updateLessonSchema.parse(await req.json());
    const lesson = await courseAdminService.updateLesson(lessonId, body, session.userId);
    return apiSuccess(lesson);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { lessonId } = await context.params;
    await courseAdminService.deleteLesson(lessonId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
