import { apiSuccess, withAuth } from "@/lib/api/with-auth";
import { learningAdminService } from "@/services/learning-admin.service";

export const GET = withAuth(async (_request, session) => {
  return apiSuccess(await learningAdminService.getMyAssignments(session.userId));
});
