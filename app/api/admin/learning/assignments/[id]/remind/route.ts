import { NextRequest } from "next/server";
import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { learningAdminService } from "@/services/learning-admin.service";

const ASSIGN_UPDATE = [
  Permission.LEARNING_ASSIGNMENTS_UPDATE,
  Permission.COURSES_MANAGE,
];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const handler = withAnyPermission(ASSIGN_UPDATE, async (_req, session) => {
    const { id } = await context.params;
    return apiSuccess(await learningAdminService.remindAssignment(session.userId, id));
  });
  return handler(_request);
}
