import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { xapiImportSchema } from "@/lib/validations/lrs";
import { lrsService } from "@/services/lrs.service";

export const POST = withPermission(Permission.COURSES_MANAGE, async (request: NextRequest, session) => {
  const { statement } = xapiImportSchema.parse(await request.json());
  const userId = request.nextUrl.searchParams.get("userId") ?? session.userId;
  const event = await lrsService.importXapiStatement(userId, statement as unknown as import("@/types/learning-lrs").XapiStatement);
  return apiSuccess(event);
});
