import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { notificationService } from "@/services/notification.service";

export const GET = withAuth(async (_request, session) => {
  const inbox = await notificationService.getInbox(
    session.userId,
    session.role,
    session.permissions
  );
  return apiSuccess({
    items: inbox.items,
    unread: inbox.unreadCount,
  });
});
