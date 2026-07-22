import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateBankQuestionSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ itemId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (req, session) => {
    const { itemId } = await context.params;
    const body = updateBankQuestionSchema.parse(await req.json());
    const item = await assessmentService.updateBankItem(itemId, body, session.userId);
    return apiSuccess(item);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (_req, session) => {
    const { itemId } = await context.params;
    await assessmentService.deleteBankItem(itemId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
