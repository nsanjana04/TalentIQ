import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";
import { bootstrapService } from "@/services/bootstrap.service";

export const GET = withAuth(async () => {
  return apiSuccess(await bootstrapService.checkHealth());
});

export const POST = withAuth(async (request: NextRequest, session) => {
  if (process.env.NODE_ENV === "production") {
    requirePermission(session, Permission.SETTINGS_MANAGE);
  }
  const result = await bootstrapService.runBootstrap();
  return apiSuccess(result);
});
