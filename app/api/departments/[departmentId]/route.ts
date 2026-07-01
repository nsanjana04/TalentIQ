import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateDepartmentSchema } from "@/lib/validations/departments";
import { departmentService } from "@/services/department.service";

type RouteContext = { params: Promise<{ departmentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.DEPARTMENTS_MANAGE, async (req, session) => {
    const { departmentId } = await context.params;
    const body = updateDepartmentSchema.parse(await req.json());
    const dept = await departmentService.update(departmentId, body, session.userId);
    return apiSuccess(dept);
  });
  return handler(request);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.DEPARTMENTS_MANAGE, async (_req, session) => {
    const { departmentId } = await context.params;
    await departmentService.remove(departmentId, session.userId);
    return apiSuccess({ deleted: true });
  });
  return handler(_request);
}
