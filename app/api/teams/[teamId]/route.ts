import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateTeamSchema } from "@/lib/validations/departments";
import { departmentService } from "@/services/department.service";

type RouteContext = { params: Promise<{ teamId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.DEPARTMENTS_MANAGE, async (req, session) => {
    const { teamId } = await context.params;
    const body = updateTeamSchema.parse(await req.json());
    const dept = await departmentService.updateTeam(teamId, body, session.userId);
    return apiSuccess(dept);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.DEPARTMENTS_MANAGE, async (_req, session) => {
    const { teamId } = await context.params;
    await departmentService.removeTeam(teamId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
