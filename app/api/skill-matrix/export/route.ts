import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { requireAnyPermission } from "@/lib/rbac/guard";
import { exportQuerySchema } from "@/lib/validations/skill-matrix";
import { skillMatrixService } from "@/services/skill-matrix.service";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");

    requireAnyPermission(session, [Permission.ANALYTICS_VIEW, Permission.REPORTS_VIEW]);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = exportQuerySchema.parse(params);
    const { buffer, contentType, filename } = await skillMatrixService.export(
      session.userId,
      session.role,
      query
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
