import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateLevelSchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { id } = await context.params;
    const body = updateLevelSchema.parse(await req.json());
    const result = await skillAdminService.updateLevel(id, body, session.userId);
    return apiSuccess(result);
  });
  return handler(request);
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { id } = await context.params;
    await skillAdminService.deleteLevel(id, session.userId);
    return apiSuccess({ success: true });
  });
  return handler(request);
}
