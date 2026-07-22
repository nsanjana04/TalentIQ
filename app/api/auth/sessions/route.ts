import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { authService } from "@/services/auth.service";

export const GET = withAuth(async (request, session) => {
  const currentToken = request.cookies.get("talentiq_refresh_token")?.value;
  const sessions = await authService.getSessions(session.userId, currentToken);
  return apiSuccess(sessions);
});

export const DELETE = withAuth(async (request, session) => {
  const currentToken = request.cookies.get("talentiq_refresh_token")?.value;
  const result = await authService.revokeAllSessions(session.userId, currentToken);
  return apiSuccess(result);
});
