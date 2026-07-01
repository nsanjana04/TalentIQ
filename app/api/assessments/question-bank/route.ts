import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createBankQuestionSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

export const GET = withPermission(Permission.ASSESSMENTS_MANAGE, async (request: NextRequest) => {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  return apiSuccess(await assessmentService.listBank(search));
});

export const POST = withPermission(Permission.ASSESSMENTS_MANAGE, async (request: NextRequest, session) => {
  const body = createBankQuestionSchema.parse(await request.json());
  const item = await assessmentService.createBankItem(body, session.userId);
  return apiSuccess(item);
});
