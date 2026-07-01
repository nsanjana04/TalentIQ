import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { assessmentService } from "@/services/assessment.service";

export const GET = withPermission(Permission.ASSESSMENTS_MANAGE, async (request: NextRequest) => {
  const assessmentId = request.nextUrl.searchParams.get("assessmentId") ?? undefined;
  return apiSuccess(await assessmentService.listAttempts(assessmentId));
});
