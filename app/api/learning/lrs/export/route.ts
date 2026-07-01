import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { handleApiError } from "@/lib/errors/api-error";
import { AppError } from "@/lib/errors/app-error";
import { Permission } from "@/lib/rbac/permissions";
import { requirePermission } from "@/lib/rbac/guard";
import { lrsService } from "@/services/lrs.service";
import type { LearningReportFormat } from "@/types/learning-lrs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) throw new AppError("UNAUTHORIZED", "Authentication required");
    requirePermission(session, Permission.REPORTS_VIEW);

    const format = (request.nextUrl.searchParams.get("format") ?? "csv") as LearningReportFormat;
    const { buffer, contentType, filename } = await lrsService.exportReport(
      session.userId,
      session.role,
      format
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
