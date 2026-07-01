import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { saveAnswersSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (_req, session) => {
    const { attemptId } = await context.params;
    const sessionData = await assessmentService.buildSession(attemptId, session.userId);
    return apiSuccess(sessionData);
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (req, session) => {
    const { attemptId } = await context.params;
    const body = saveAnswersSchema.parse(await req.json());
    const result = await assessmentService.saveAnswers(
      attemptId,
      session.userId,
      body.answers
    );
    return apiSuccess(result);
  });
  return handler(request);
}
