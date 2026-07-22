import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { openCourseListQuerySchema } from "@/lib/validations/learning-content";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const query = openCourseListQuerySchema.parse({
    ...Object.fromEntries(request.nextUrl.searchParams),
    published: "true",
  });
  return apiSuccess(
    await learningContentService.listOpenCourses(query, {
      userId: session.userId,
      assignedOnly: true,
    })
  );
});
