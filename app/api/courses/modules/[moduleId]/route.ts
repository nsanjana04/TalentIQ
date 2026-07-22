import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateModuleSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { moduleId } = await context.params;
    const body = updateModuleSchema.parse(await req.json());
    const courseModule = await courseAdminService.updateModule(moduleId, body, session.userId);
    return apiSuccess(courseModule);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { moduleId } = await context.params;
    await courseAdminService.deleteModule(moduleId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
