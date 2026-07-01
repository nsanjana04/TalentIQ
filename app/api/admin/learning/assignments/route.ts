import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { createAssignmentSchema, assignmentListQuerySchema } from "@/lib/validations/learning-admin";
import { learningAdminService } from "@/services/learning-admin.service";

const ASSIGN_VIEW = [
  Permission.LEARNING_ASSIGNMENTS_VIEW,
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.COURSES_MANAGE,
];

const ASSIGN_CREATE = [
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.COURSES_MANAGE,
];

export const GET = withAnyPermission(ASSIGN_VIEW, async (request) => {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const query = assignmentListQuerySchema.parse(params);
  return apiSuccess(await learningAdminService.listAssignments(query));
});

export const POST = withAnyPermission(ASSIGN_CREATE, async (request, session) => {
  const body = createAssignmentSchema.parse(await request.json());
  return apiSuccess(
    await learningAdminService.createAssignment(session.userId, session.role, body)
  );
});
