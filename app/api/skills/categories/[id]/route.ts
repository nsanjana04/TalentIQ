import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateCategorySchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (req, session) => {
    const { id } = await context.params;
    const body = updateCategorySchema.parse(await req.json());
    const result = await skillAdminService.updateCategory(id, body, session.userId);
    return apiSuccess(result);
  });
  return handler(request);
}

export async function DELETE(request: NextRequest, context: Ctx) {
  const handler = withPermission(Permission.COURSES_MANAGE, async (_req, session) => {
    const { id } = await context.params;
    await skillAdminService.deleteCategory(id, session.userId);
    return apiSuccess({ success: true });
  });
  return handler(request);
}
