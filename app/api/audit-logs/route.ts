import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { auditLogsQuerySchema } from "@/lib/validations/settings";
import { settingsService } from "@/services/settings.service";

export const GET = withPermission(Permission.AUDITLOGS_VIEW, async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const query = auditLogsQuerySchema.parse(params);
  return apiSuccess(await settingsService.getAuditLogs(query));
});
