import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ questionId: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (_req, session) => {
    const { questionId } = await context.params;
    await assessmentService.deleteQuestion(questionId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
