import { NextRequest } from "next/server";
import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { updateAssignmentSchema } from "@/lib/validations/learning-admin";
import { learningAdminService } from "@/services/learning-admin.service";

const ASSIGN_VIEW = [
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.COURSES_MANAGE,
];

const ASSIGN_UPDATE = [
  Permission.LEARNING_ASSIGNMENTS_UPDATE,
  Permission.COURSES_MANAGE,
];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(ASSIGN_VIEW, async () => {
    const { id } = await context.params;
    return apiSuccess(await learningAdminService.getAssignment(id));
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(ASSIGN_UPDATE, async (_req, session) => {
    const { id } = await context.params;
    const body = updateAssignmentSchema.parse(await request.json());
    return apiSuccess(
      await learningAdminService.updateAssignment(session.userId, id, body)
    );
  });
  return handler(request);
}
