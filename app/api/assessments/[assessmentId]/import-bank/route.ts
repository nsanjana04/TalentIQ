import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { importBankSchema } from "@/lib/validations/assessments";
import { assessmentService } from "@/services/assessment.service";

type RouteContext = { params: Promise<{ assessmentId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.ASSESSMENTS_MANAGE, async (req, session) => {
    const { assessmentId } = await context.params;
    const parsed = importBankSchema.parse(await req.json());
    const items = await assessmentService.importFromBank(
      assessmentId,
      parsed.bankItemIds,
      session.userId
    );
    return apiSuccess({ imported: items.length, items });
  });
  return handler(request);
}
