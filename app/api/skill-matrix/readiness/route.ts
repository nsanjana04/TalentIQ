import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { matrixQuerySchema } from "@/lib/validations/skill-matrix";
import { skillMatrixService } from "@/services/skill-matrix.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (request: NextRequest, session) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = matrixQuerySchema.parse(params);
  const readiness = await skillMatrixService.getReadiness(session.userId, session.role, query);
  return apiSuccess(readiness);
});
