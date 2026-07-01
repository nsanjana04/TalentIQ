import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createDepartmentSchema } from "@/lib/validations/departments";
import { departmentService } from "@/services/department.service";

export const GET = withPermission(Permission.DEPARTMENTS_VIEW, async () => {
  return apiSuccess(await departmentService.list());
});

export const POST = withPermission(Permission.DEPARTMENTS_MANAGE, async (request: NextRequest, session) => {
  const body = createDepartmentSchema.parse(await request.json());
  const dept = await departmentService.create(body, session.userId);
  return apiSuccess(dept);
});
