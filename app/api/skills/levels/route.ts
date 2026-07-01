import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createLevelSchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async () => {
  return apiSuccess(await skillAdminService.listLevels());
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createLevelSchema.parse(await request.json());
  const result = await skillAdminService.createLevel(body, session.userId);
  return apiSuccess(result);
});
