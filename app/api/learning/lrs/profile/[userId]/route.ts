import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { lrsService } from "@/services/lrs.service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.USERS_VIEW, async (_req, _session) => {
    const { userId } = await context.params;
    const profile = await lrsService.getEmployeeLearningProfile(userId);
    return apiSuccess(profile);
  });
  return handler(_request);
}
