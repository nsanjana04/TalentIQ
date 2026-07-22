import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createTeamSchema } from "@/lib/validations/departments";
import { departmentService } from "@/services/department.service";

export const POST = withPermission(Permission.DEPARTMENTS_MANAGE, async (request: NextRequest, session) => {
  const body = createTeamSchema.parse(await request.json());
  const dept = await departmentService.createTeam(body, session.userId);
  return apiSuccess(dept);
});
