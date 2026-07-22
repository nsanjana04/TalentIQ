import { NextRequest } from "next/server";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { settingsCategorySchema, updateSettingsSchema } from "@/lib/validations/settings";
import { settingsService } from "@/services/settings.service";
import { getClientIp, getUserAgent } from "@/lib/utils";

type RouteContext = { params: Promise<{ category: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.SETTINGS_MANAGE, async () => {
    const { category } = await context.params;
    const parsed = settingsCategorySchema.parse(category);
    return apiSuccess(await settingsService.getCategory(parsed));
  });
  return handler(_request);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const handler = withPermission(Permission.SETTINGS_MANAGE, async (req, session) => {
    const { category } = await context.params;
    const parsed = settingsCategorySchema.parse(category);
    const body = updateSettingsSchema.parse(await req.json());

    const data = await settingsService.updateCategory(
      parsed,
      body,
      session.userId,
      { actorId: session.userId, ipAddress: getClientIp(req), userAgent: getUserAgent(req) }
    );
    return apiSuccess(data);
  });
  return handler(request);
}
