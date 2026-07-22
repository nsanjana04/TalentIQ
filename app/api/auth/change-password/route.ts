import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { changePasswordSchema } from "@/lib/validations/auth";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { authService } from "@/services/auth.service";

export const POST = withAuth(async (request, session) => {
  const body = changePasswordSchema.parse(await request.json());
  const result = await authService.changePassword(
    session.userId,
    body.currentPassword,
    body.newPassword,
    { ipAddress: getClientIp(request), userAgent: getUserAgent(request) }
  );
  return apiSuccess(result);
});
