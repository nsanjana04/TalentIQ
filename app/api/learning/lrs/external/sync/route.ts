import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError, apiSuccess } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";
import { externalSyncSchema } from "@/lib/validations/lrs";
import { lrsService } from "@/services/lrs.service";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.COURSES_VIEW);

    const body = externalSyncSchema.parse(await request.json());
    const count = await lrsService.syncExternalProvider(
      session.userId,
      body.provider,
      body.accessToken
    );
    return apiSuccess({ synced: count });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getSessionFromRequest(_request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.COURSES_VIEW);

    const count = await lrsService.syncAllExternalProviders(session.userId);
    return apiSuccess({ synced: count });
  } catch (error) {
    return handleApiError(error);
  }
}
