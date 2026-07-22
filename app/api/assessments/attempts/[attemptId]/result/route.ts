import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { attemptId } = await context.params;
    const result = await assessmentService.getResult(attemptId, session.userId);
    return apiSuccess(result);
  });
  return handler(_request);
}
