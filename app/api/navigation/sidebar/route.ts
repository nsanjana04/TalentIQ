import { withAuth } from "@/lib/api/with-auth";
import { apiSuccess } from "@/lib/errors/api-error";
import { screenAccessService } from "@/services/screen-access.service";

export const GET = withAuth(async (_request, session) => {
  const sidebar = await screenAccessService.getSidebar(session.userId);
  return apiSuccess(sidebar);
});
