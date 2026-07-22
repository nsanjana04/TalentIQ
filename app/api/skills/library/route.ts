import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createSkillSchema } from "@/lib/validations/skills";
import { skillAdminService } from "@/services/skill-admin.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (request: NextRequest) => {
  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  return apiSuccess(await skillAdminService.listSkills(search));
});

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const body = createSkillSchema.parse(await request.json());
  const result = await skillAdminService.createSkill(body, session.userId);
  return apiSuccess(result);
});
