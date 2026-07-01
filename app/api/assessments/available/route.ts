import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

export const GET = withPermission(Permission.COURSES_VIEW, async (_request, session) => {
  return apiSuccess(await assessmentService.listAvailable(session.userId));
});
