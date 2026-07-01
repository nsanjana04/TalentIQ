import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

export const GET = withPermission(Permission.ASSESSMENTS_MANAGE, async () => {
  return apiSuccess(await assessmentService.getOverview());
});
