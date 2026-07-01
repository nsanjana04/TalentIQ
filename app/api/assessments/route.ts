import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentListQuerySchema, createAssessmentSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

export const GET = withPermission(Permission.ASSESSMENTS_MANAGE, async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = assessmentListQuerySchema.parse(params);
  return apiSuccess(await assessmentService.listAssessments(query));
});

export const POST = withPermission(Permission.ASSESSMENTS_MANAGE, async (request: NextRequest, session) => {
  const body = createAssessmentSchema.parse(await request.json());
  const assessment = await assessmentService.createAssessment(body, session.userId);
  return apiSuccess(assessment);
});
