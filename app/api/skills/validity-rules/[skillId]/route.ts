import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { skillAdminService } from "@/services/skill-admin.service";

type Ctx = { params: Promise<{ skillId: string }> };

export async function DELETE(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { skillId } = await context.params;
    await skillAdminService.deleteValidityRule(skillId, session.userId);
    return apiSuccess({ success: true });
  });
  return handler(request);
}
