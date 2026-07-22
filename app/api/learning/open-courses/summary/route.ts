import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (_request, session) => {
  return apiSuccess(await learningContentService.getOpenCourseLibrarySummary(session.userId));
});
