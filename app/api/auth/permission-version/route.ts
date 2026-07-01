import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/errors/api-error";
import { getSessionFromRequest } from "@/lib/auth/session";
import { AppError } from "@/lib/errors/app-error";
import { permissionVersionService } from "@/lib/rbac/permission-version.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request, { enrich: false });
    if (!session) {
      throw new AppError("UNAUTHORIZED", "Not authenticated");
    }

    const versions = await permissionVersionService.getVersions(session.userId);
    return apiSuccess(versions);
  } catch (error) {
    return handleApiError(error);
  }
}
