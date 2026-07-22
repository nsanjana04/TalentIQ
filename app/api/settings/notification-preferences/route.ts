import { NextRequest } from "next/server";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { notificationPreferencesSchema } from "@/lib/validations/settings";
import { settingsService } from "@/services/settings.service";

export const GET = withAuth(async (_request, session) => {
  return apiSuccess(await settingsService.getUserNotificationPrefs(session.userId));
});

export const PATCH = withAuth(async (request: NextRequest, session) => {
  const body = notificationPreferencesSchema.parse(await request.json());
  const prefs = await settingsService.updateUserNotificationPrefs(session.userId, body);
  return apiSuccess(prefs);
});
