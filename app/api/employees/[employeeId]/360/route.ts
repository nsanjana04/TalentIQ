import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { employeeIntelligenceService } from "@/services/employee-intelligence.service";

type RouteContext = { params: Promise<{ employeeId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.USERS_VIEW, async (_req, session) => {
    const { employeeId } = await context.params;
    const profile = await employeeIntelligenceService.getEmployee360(
      session.userId,
      session.role,
      employeeId
    );
    return apiSuccess(profile);
  });
  return handler(_request);
}
