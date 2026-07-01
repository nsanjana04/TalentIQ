import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createRoleMappingSchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async () => {
  return apiSuccess(await skillAdminService.listRoleMappings());
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createRoleMappingSchema.parse(await request.json());
  const result = await skillAdminService.createRoleMapping(body, session.userId);
  return apiSuccess(result);
});
