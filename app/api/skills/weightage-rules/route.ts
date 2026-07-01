import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createWeightageRuleSchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async () => {
  return apiSuccess(await skillAdminService.listWeightageRules());
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createWeightageRuleSchema.parse(await request.json());
  const result = await skillAdminService.createWeightageRule(body, session.userId);
  return apiSuccess(result);
});
