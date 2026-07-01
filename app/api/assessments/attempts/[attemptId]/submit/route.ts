import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { saveAnswersSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ attemptId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.COURSES_VIEW, async (req, session) => {
    const { attemptId } = await context.params;
    const body = saveAnswersSchema.parse(await req.json());
    const result = await assessmentService.submitAttempt(
      attemptId,
      session.userId,
      body.answers
    );
    return apiSuccess(result);
  });
  return handler(request);
}
