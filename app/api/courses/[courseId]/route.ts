import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateCourseSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async () => {
    const { courseId } = await context.params;
    return apiSuccess(await courseAdminService.getCourse(courseId));
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { courseId } = await context.params;
    const body = updateCourseSchema.parse(await req.json());
    const course = await courseAdminService.updateCourse(courseId, body, session.userId);
    return apiSuccess(course);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { courseId } = await context.params;
    await courseAdminService.deleteCourse(courseId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
