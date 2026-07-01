import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { getClientIp, getUserAgent } from "@/lib/utils";
import { authService } from "@/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const body = resetPasswordSchema.parse(await request.json());
    const result = await authService.resetPassword(
      body.email,
      body.token,
      body.password,
      { ipAddress: getClientIp(request), userAgent: getUserAgent(request) }
    );
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
