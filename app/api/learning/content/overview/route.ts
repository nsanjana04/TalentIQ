import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningContentService } from "@/services/learning-content.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (_request: NextRequest, session) => {
  const overview = await learningContentService.getPublishedOverview(session.userId);
  return apiSuccess(overview);
});
