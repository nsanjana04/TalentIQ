import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ assessmentId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { assessmentId } = await context.params;
    const sessionData = await assessmentService.startAttempt(assessmentId, session.userId);
    return apiSuccess(sessionData);
  });
  return handler(_request);
}
