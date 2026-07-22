import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { courseAdminService } from "@/services/course-admin.service";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_MANAGE, async () => {
    const { courseId } = await context.params;
    return apiSuccess(await courseAdminService.getAnalytics(courseId));
  });
  return handler(_request);
}
