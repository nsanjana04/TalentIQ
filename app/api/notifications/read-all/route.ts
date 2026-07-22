import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { settingsService } from "@/services/settings.service";

export const POST = withAuth(async (_request, session) => {
  await settingsService.markAllNotificationsRead(session.userId);
  return apiSuccess({ success: true });
});
