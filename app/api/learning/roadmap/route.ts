import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningRoadmapQuerySchema } from "@/lib/validations/learning-roadmap";
import { learningRoadmapService } from "@/services/learning-roadmap.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (request: NextRequest, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = learningRoadmapQuerySchema.parse(params);
  const roadmap = await learningRoadmapService.getRoadmap(session.userId, session.role, query);
  return apiSuccess(roadmap);
});
