import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createCategorySchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async () => {
  return apiSuccess(await skillAdminService.listCategories());
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createCategorySchema.parse(await request.json());
  const result = await skillAdminService.createCategory(body, session.userId);
  return apiSuccess(result);
});
