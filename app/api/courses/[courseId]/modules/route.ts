import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createModuleSchema } from "@/lib/validations/course-admin";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { courseId } = await context.params;
    const body = createModuleSchema.parse(await req.json());
    const courseModule = await courseAdminService.createModule(courseId, body, session.userId);
    return apiSuccess(courseModule);
  });
  return handler(request);
}
