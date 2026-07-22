import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateAssessmentSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ assessmentId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async () => {
    const { assessmentId } = await context.params;
    return apiSuccess(await assessmentService.getAssessment(assessmentId));
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (req, session) => {
    const { assessmentId } = await context.params;
    const body = updateAssessmentSchema.parse(await req.json());
    const assessment = await assessmentService.updateAssessment(assessmentId, body, session.userId);
    return apiSuccess(assessment);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (_req, session) => {
    const { assessmentId } = await context.params;
    await assessmentService.deleteAssessment(assessmentId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
