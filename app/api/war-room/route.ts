import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { Permission } from "@/lib/rbac/permissions";
import { warRoomService } from "@/services/war-room.service";

export const GET = withPermission(Permission.ANALYTICS_VIEW, async (_request, session) => {
  return apiSuccess(await warRoomService.getBriefing(session.userId, session.role));
});
