import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createAssessmentQuestionSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ assessmentId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (req, session) => {
    const { assessmentId } = await context.params;
    const input = createAssessmentQuestionSchema.parse(await req.json());
    const question = await assessmentService.addQuestion(assessmentId, input, session.userId);
    return apiSuccess(question);
  });
  return handler(request);
}
