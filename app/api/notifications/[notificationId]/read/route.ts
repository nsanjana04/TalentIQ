import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { settingsService } from "@/services/settings.service";

type RouteContext = { params: Promise<{ notificationId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const handler = withAuth(async (_req, session) => {
    const { notificationId } = await context.params;
    await settingsService.markNotificationRead(notificationId, session.userId);
    return apiSuccess({ success: true });
  });
  return handler(_request as import("next/server").NextRequest);
}
