import { apiSuccess, withAnyPermission } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assignmentPreviewSchema } from "@/lib/validations/learning-admin";
import { learningAdminService } from "@/services/learning-admin.service";

const ASSIGN_CREATE = [
  Permission.LEARNING_ASSIGNMENTS_CREATE,
  Permission.COURSES_MANAGE,
];

export const POST = withAnyPermission(ASSIGN_CREATE, async (request) => {
  const body = assignmentPreviewSchema.parse(await request.json());
  return apiSuccess(await learningAdminService.previewAssignment(body));
});
