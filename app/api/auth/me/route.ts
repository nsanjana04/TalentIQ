import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import { getSessionFromRequest } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { authService } from "@/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request, { enrich: false });

    if (!session) {
      throw new AppError("UNAUTHORIZED", "Not authenticated");
    }

    const user = await authService.getCurrentUser(session.userId);
    return apiSuccess(user);
  } catch (error) {
    return handleApiError(error);
  }
}
